// app/functions/create-function-calls.server.ts

import { redirect } from "@remix-run/node";
import { sql } from "drizzle-orm";
import { hc } from "hono/client";

import type { ResetFactoryRouteType } from "~/api/run-route/reset-factory";
import { functionCalls, objects, serverFunctions } from "~/db/schema";
import { FunctionCallStatus } from "~/db/schema/function-calls/schema";
import { ServerFunctionType } from "~/db/schema/server-functions/schema";
import type { ServerFunctionName } from "~/lib/server-functions-types";
import type { ExtendedContext } from "~/middleware";

const client = hc<ResetFactoryRouteType>("http://localhost:5173");

export async function createFunctionCalls(
  request: ExtendedContext,
  functionName: ServerFunctionName,
) {
  // First try to find existing server function
  let serverFunction = await request.db.query.serverFunctions.findFirst({
    where: sql`${serverFunctions.name} = ${functionName}`,
    columns: {
      id: true,
      name: true,
      type: true,
      requestId: true,
      functionCallId: true,
    },
  });

  // If it doesn't exist, create it
  if (!serverFunction) {
    const [newServerFunction] = await request.db
      .insert(serverFunctions)
      .values({
        requestId: request.requestId,
        name: functionName,
        type: ServerFunctionType.SYSTEM,
        functionCallId: request.functionCallId,
      })
      .returning({
        name: serverFunctions.name,
        type: serverFunctions.type,
        requestId: serverFunctions.requestId,
        functionCallId: serverFunctions.functionCallId,
        id: serverFunctions.id,
      });
    serverFunction = newServerFunction;
  }

  const [functionCall] = await request.db
    .insert(functionCalls)
    .values({
      serverFunctionId: serverFunction.id,
      requestId: request.requestId,
      status: FunctionCallStatus.READY_FOR_APPROVAL,
    })
    .returning({
      id: functionCalls.id,
    });

  // Create object for the function call
  await request.db.insert(objects).values({
    modelId: 4, // Function calls model ID
    recordId: functionCall.id,
    requestId: request.requestId,
    functionCallId: request.functionCallId,
  });

  try {
    const response = await client.run$45$route.reset$45$factory.$post();
    if (!response.ok) {
      throw new Error(`Failed to reset factory: ${response.statusText}`);
    }

    await request.db
      .update(functionCalls)
      .set({ status: FunctionCallStatus.COMPLETED })
      .where(sql`${functionCalls.requestId} = ${request.requestId}`);
  } catch (error) {
    await request.db
      .update(functionCalls)
      .set({ status: FunctionCallStatus.FAILED })
      .where(sql`${functionCalls.requestId} = ${request.requestId}`);
    throw error;
  }

  return redirect(`/objects?function-call-id=${request.functionCallId}`);
}

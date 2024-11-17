// app/functions/create-function-calls.server.ts

import { redirect } from "@remix-run/node";
import { sql } from "drizzle-orm";

import {
  functionCalls,
  FunctionCallStatus,
  serverFunctions,
  ServerFunctionType,
} from "~/db/schema";
import { SERVER_FUNCTIONS_HANDLERS } from "~/lib/server-functions";
import type { ServerFunctionName } from "~/lib/server-functions-types";
import type { RequestExtensions } from "~/middleware";

export async function createFunctionCalls(
  request: RequestExtensions,
  functionName: ServerFunctionName,
) {
  console.log("createFunctionCalls called");
  console.log("functionName:", functionName);

  if (!functionName || !(functionName in SERVER_FUNCTIONS_HANDLERS)) {
    throw new Error(`Invalid function name: ${functionName}`);
  }

  const foundRequest = await request.db.query.requests.findFirst();
  if (!foundRequest) {
    throw new Error("No request found");
  }

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
        requestId: foundRequest.id,
        name: functionName,
        type: ServerFunctionType.SYSTEM,
      })
      .returning({
        id: serverFunctions.id,
        name: serverFunctions.name,
        type: serverFunctions.type,
        requestId: serverFunctions.requestId,
        functionCallId: serverFunctions.functionCallId,
      });
    serverFunction = newServerFunction;
  }

  console.log("After server function creation - queries:", request.queries);

  const [functionCall] = await request.db
    .insert(functionCalls)
    .values({
      serverFunctionId: serverFunction.id,
      requestId: foundRequest.id,
      status: FunctionCallStatus.READY_FOR_APPROVAL,
      args: null,
      result: null,
    })
    .returning({
      id: functionCalls.id,
    });

  console.log("After function call creation - queries:", request.queries);

  try {
    await SERVER_FUNCTIONS_HANDLERS[functionName].handler(request);

    // Mark as completed after successful execution
    await request.db
      .update(functionCalls)
      .set({ status: FunctionCallStatus.COMPLETED })
      .where(sql`${functionCalls.id} = ${functionCall.id}`);
  } catch (error) {
    // Optionally mark as failed if there's an error
    await request.db
      .update(functionCalls)
      .set({ status: FunctionCallStatus.FAILED })
      .where(sql`${functionCalls.id} = ${functionCall.id}`);
    throw error;
  }

  return redirect(`/objects?function-call-id=${functionCall.id}`);
}

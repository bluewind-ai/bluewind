// app/functions/create-function-calls.server.ts
import { redirect } from "@remix-run/node";
import { sql } from "drizzle-orm";

import { functionCalls, serverFunctions } from "~/db/schema";
import { FunctionCallStatus } from "~/db/schema/function-calls/schema";
import { ServerFunctionType } from "~/db/schema/server-functions/schema";
import { SERVER_FUNCTIONS_HANDLERS } from "~/lib/server-functions";
import type { ServerFunctionName } from "~/lib/server-functions-types";
import type { ExtendedContext } from "~/middleware";

export async function createFunctionCalls(
  request: ExtendedContext,
  functionName: ServerFunctionName,
) {
  if (!functionName || !(functionName in SERVER_FUNCTIONS_HANDLERS)) {
    throw new Error(`Invalid function name: ${functionName}`);
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
        requestId: request.requestId,
        name: functionName,
        type: ServerFunctionType.SYSTEM,
        functionCallId: request.functionCallId || 1, // Added - use parent's functionCallId or root
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
  const [functionCall] = await request.db
    .insert(functionCalls)
    .values({
      serverFunctionId: serverFunction.id,
      requestId: request.requestId,
      functionCallId: request.functionCallId || 1, // Use parent's id if available, otherwise root
      status: FunctionCallStatus.READY_FOR_APPROVAL,
      args: null,
      result: null,
    })
    .returning({
      id: functionCalls.id,
    });
  // Just set the function call ID on the request
  request.functionCallId = functionCall.id;
  try {
    await SERVER_FUNCTIONS_HANDLERS[functionName].handler(request);
    // Mark as completed after successful execution
    await request.db
      .update(functionCalls)
      .set({ status: FunctionCallStatus.COMPLETED })
      .where(sql`${functionCalls.id} = ${functionCall.id}`);
  } catch (error) {
    await request.db
      .update(functionCalls)
      .set({ status: FunctionCallStatus.FAILED })
      .where(sql`${functionCalls.id} = ${functionCall.id}`);
    throw error;
  }
  return redirect(`/objects?function-call-id=${functionCall.id}`);
}

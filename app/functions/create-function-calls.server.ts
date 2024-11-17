// app/functions/create-function-calls.server.ts

import { redirect } from "@remix-run/node";
import { functionCalls, FunctionCallStatus } from "~/db/schema";
import { serverFunctions, ServerFunctionType } from "~/db/schema";
import { SERVER_FUNCTIONS_HANDLERS } from "~/lib/server-functions";
import type { ServerFunctionName } from "~/lib/server-functions-types";
import type { RequestExtensions } from "~/middleware";

export async function createFunctionCalls(request: RequestExtensions, functionName: ServerFunctionName) {
  console.log("createFunctionCalls called");
  console.log("functionName:", functionName);

  if (!functionName || !(functionName in SERVER_FUNCTIONS_HANDLERS)) {
    throw new Error(`Invalid function name: ${functionName}`);
  }

  // Get the current request using the proxied db client
  const foundRequest = await request.db.query.requests.findFirst();
  if (!foundRequest) {
    throw new Error("No request found");
  }

  // Here's the key change - request.db is the proxied client that tracks queries
  const [serverFunction] = await request.db
    .insert(serverFunctions)
    .values({
      requestId: foundRequest.id,
      name: functionName,
      type: ServerFunctionType.SYSTEM,
    })
    .returning({
      id: serverFunctions.id,  // Explicitly specify what to return
    });

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
      id: functionCalls.id,  // Explicitly specify what to return
    });

  console.log("After function call creation - queries:", request.queries);

  // Execute the handler
  await SERVER_FUNCTIONS_HANDLERS[functionName].handler(request);

  // Redirect to objects with the function call ID
  return redirect(`/objects?function-call-id=${functionCall.id}`);
}
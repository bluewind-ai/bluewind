// app/functions/create-function-calls.server.ts

import { redirect } from "@remix-run/node";
import { functionCalls, FunctionCallStatus } from "~/db/schema";
import { serverFunctions, ServerFunctionType } from "~/db/schema";
import { SERVER_FUNCTIONS_HANDLERS } from "~/lib/server-functions";
import type { ServerFunctionName } from "~/lib/server-functions-types";
import type { RequestExtensions } from "~/middleware";

export async function createFunctionCalls(request: Request, context: RequestExtensions) {
  console.log("createFunctionCalls called");

  const formData = await request.formData();
  const functionName = formData.get("function") as ServerFunctionName;
  console.log("functionName:", functionName);

  if (!functionName || !(functionName in SERVER_FUNCTIONS_HANDLERS)) {
    throw new Error(`Invalid function name: ${functionName}`);
  }

  // Get the current request
  const foundRequest = await context.db.query.requests.findFirst();
  if (!foundRequest) {
    throw new Error("No request found");
  }

  // Create server function record
  const [serverFunction] = await context.db
    .insert(serverFunctions)
    .values({
      requestId: foundRequest.id,
      name: functionName,
      type: ServerFunctionType.SYSTEM,
    })
    .returning();

  // Create function call record with your schema
  const [functionCall] = await context.db
    .insert(functionCalls)
    .values({
      serverFunctionId: serverFunction.id,
      requestId: foundRequest.id,
      status: FunctionCallStatus.READY_FOR_APPROVAL,
      args: null,  // optional
      result: null, // optional
    })
    .returning();

  // Execute the handler
  await SERVER_FUNCTIONS_HANDLERS[functionName].handler(context);

  // Redirect to objects with the function call ID
  return redirect(`/objects?function-call-id=${functionCall.id}`);
}
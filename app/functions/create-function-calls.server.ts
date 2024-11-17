// app/functions/create-function-calls.server.ts

import { SERVER_FUNCTIONS, type ServerFunctionName } from "~/lib/server-functions";
import type { RequestExtensions } from "~/middleware";

export async function createFunctionCalls(request: Request, context: RequestExtensions) {
  console.log("createFunctionCalls called");

  const formData = await request.formData();
  const functionName = formData.get("function") as ServerFunctionName;
  console.log("functionName:", functionName);

  if (!functionName || !(functionName in SERVER_FUNCTIONS)) {
    throw new Error(`Invalid function name: ${functionName}`);
  }

  await SERVER_FUNCTIONS[functionName].handler(context);
  return null;
}

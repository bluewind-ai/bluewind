// app/functions/create-function-calls.server.ts

import { redirect } from "@remix-run/node";

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

  await SERVER_FUNCTIONS_HANDLERS[functionName].handler(context);
  return redirect("/objects");
}

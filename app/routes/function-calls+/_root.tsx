// app/routes/function-calls+/_root.tsx

import { type ActionFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { createFunctionCalls } from "~/functions/create-function-calls.server";
import type { ServerFunctionName } from "~/lib/server-functions-types";
import type { RequestExtensions } from "~/middleware";

export async function action(args: ActionFunctionArgs) {
  const { request, context } = args;
  const formData = await request.formData();
  const functionName = formData.get("function") as ServerFunctionName;

  if (!functionName) {
    throw new Error("Function name is required");
  }

  return createFunctionCalls(context as RequestExtensions, functionName);
}

export default function FunctionCallsLayout() {
  return <Outlet />;
}

// app/routes/function-calls+/_root.tsx

import { type ActionFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { createFunctionCalls } from "~/functions/create-function-calls.server";
import type { RequestExtensions } from "~/middleware";

export async function action(args: ActionFunctionArgs) {
  const { request, context } = args;
  return createFunctionCalls(request, context as RequestExtensions);
}

export default function FunctionCallsLayout() {
  return <Outlet />;
}

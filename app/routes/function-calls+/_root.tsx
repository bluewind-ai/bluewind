// app/routes/function-calls+/_root.tsx
import { type ActionFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { createFunctionCalls } from "~/functions/create-function-calls.server";
import type { RequestExtensions } from "~/middleware";

export async function action(args: ActionFunctionArgs) {
  const { request, context } = args;
  await createFunctionCalls(request, context as RequestExtensions);
  return null;
}
export default function FunctionCallsLayout() {
  return <Outlet />;
}

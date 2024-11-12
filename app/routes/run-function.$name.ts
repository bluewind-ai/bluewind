// app/routes/run-function.$name.ts

import { type ActionFunctionArgs } from "@remix-run/node";

import { actions } from "~/lib/generated/actions";
import { actionMiddleware } from "~/lib/middleware";

async function _action(args: ActionFunctionArgs) {
  const { name } = args.params;
  const fn = actions[name as keyof typeof actions];
  console.log("Executing action:", name);
  await fn();
  return { success: true };
}

export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}

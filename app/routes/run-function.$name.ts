// app/routes/run-function.$name.ts

import { type ActionFunctionArgs } from "@remix-run/node";

import { actions } from "~/lib/generated/actions";
import { actionMiddleware } from "~/lib/middleware";

async function _action(args: ActionFunctionArgs) {
  const { name } = args.params;
  const fn = actions[name as keyof typeof actions];

  if (!fn) {
    throw new Error(`Action ${name} not found`);
  }

  console.log("Executing action:", name);
  const result = await fn();
  return { success: true, result };
}

export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}

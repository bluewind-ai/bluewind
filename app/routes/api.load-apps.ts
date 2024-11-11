// app/routes/api.load-apps.ts

import { ActionFunctionArgs } from "@remix-run/node";

import { actionMiddleware } from "~/lib/middleware";

// eslint-disable-next-line unused-imports/no-unused-vars
async function _action(args: ActionFunctionArgs) {
  return { success: true };
}

export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}

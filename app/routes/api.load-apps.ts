// app/routes/api.load-apps.ts

import { ActionFunctionArgs } from "@remix-run/node";
import { beforeAction } from "~/lib/middleware";

// eslint-disable-next-line unused-imports/no-unused-vars
async function _action(args: ActionFunctionArgs) {
  return { success: true };
}

export async function action(args: ActionFunctionArgs) {
  await beforeAction(args);
  return await _action(args);
}

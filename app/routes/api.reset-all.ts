// app/routes/api.reset-all.ts

import { type ActionFunctionArgs } from "@remix-run/node";
import { exec } from "child_process";
import { promisify } from "util";
import { beforeAction } from "~/lib/middleware";

const execAsync = promisify(exec);

// eslint-disable-next-line unused-imports/no-unused-vars
async function _action(args: ActionFunctionArgs) {
  if (args.request.method !== "POST") {
    return { error: "Method not allowed", status: 405 };
  }

  await execAsync("npm run reset-all");
  return { success: true };
}

export async function action(args: ActionFunctionArgs) {
  await beforeAction(args);
  return await _action(args);
}

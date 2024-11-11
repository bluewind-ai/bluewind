// app/routes/api.reset-all.ts

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function _action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return { error: "Method not allowed", status: 405 };
  }

  await execAsync("npm run reset-all");
  return { success: true };
}

export async function action(args: ActionFunctionArgs) {
  await beforeAction(args);
  const response = await _action(args);
  await afterAction(args, response);
  return json(response);
}

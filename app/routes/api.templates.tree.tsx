// app/routes/api.templates.tree.tsx

/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { type ActionFunctionArgs } from "@remix-run/node";
import { exec } from "child_process";
import { promisify } from "util";
import { beforeAction } from "~/lib/middleware";

const execAsync = promisify(exec);

// eslint-disable-next-line unused-imports/no-unused-vars
async function _action(args: ActionFunctionArgs) {
  const { stdout } = await execAsync("tree -I 'node_modules|.git|dist|website'");
  return { content: stdout };
}

export async function action(args: ActionFunctionArgs) {
  await beforeAction(args);
  return await _action(args);
}

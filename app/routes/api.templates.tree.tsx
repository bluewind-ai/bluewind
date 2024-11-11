// app/routes/api.templates.tree.tsx

/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function _action({ request }: ActionFunctionArgs) {
  const { stdout } = await execAsync("tree -I 'node_modules|.git|dist|website'");
  return { content: stdout };
}

export async function action(args: ActionFunctionArgs) {
  await beforeAction(args);
  const response = await _action(args);
  await afterAction(args, response);
  return json(response);
}

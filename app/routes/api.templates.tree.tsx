// app/routes/api.templates.tree.tsx
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { type ActionFunctionArgs } from "@remix-run/node";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
// eslint-disable-next-line unused-imports/no-unused-vars
async function _action(args: ActionFunctionArgs) {}
export async function action(args: ActionFunctionArgs) {
  const { stdout } = await execAsync("tree -I 'node_modules|.git|dist|website'");
  return { content: stdout };
}

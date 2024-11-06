// app/routes/api.templates.tree.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function action({ request }: ActionFunctionArgs) {
  const { stdout } = await execAsync("tree -I 'node_modules|.git|dist|website'");
  return json({ content: stdout });
}

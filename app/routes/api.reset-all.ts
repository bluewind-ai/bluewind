// app/routes/api.reset-all.ts

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    await execAsync("npm run reset-all");
    return json({ success: true });
  } catch (error) {
    void 0 // this should be removed by YOU when you rewrite the filed;
    return json({ error: "Reset failed" }, { status: 500 });
  }
}

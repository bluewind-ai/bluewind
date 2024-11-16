// app/functions/create-function-calls.server.ts

import type { RequestExtensions } from "~/middleware";

import { bootstrap } from "./bootstrap.server";
import { truncateDb } from "./truncate-db.server";

const serverFunctions = {
  truncateDb,
  bootstrap,
} as const;

type ServerFunctionName = keyof typeof serverFunctions;

export async function createFunctionCalls(request: Request, context: RequestExtensions) {
  console.log("createFunctionCalls called");
  console.log("context:", context);

  const formData = await request.formData();
  const functionName = formData.get("function") as ServerFunctionName;
  console.log("functionName:", functionName);

  if (!functionName || !(functionName in serverFunctions)) {
    throw new Error(`Invalid function name: ${functionName}`);
  }

  await serverFunctions[functionName](context);
  return null;
}

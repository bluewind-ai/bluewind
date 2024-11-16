// app/functions/create-function-calls.server.ts

import type { RequestExtensions } from "~/middleware";

import { bootstrap } from "./bootstrap.server";
import { truncateDb } from "./truncate-db.server";

const serverFunctionMap = {
  bootstrap,
  truncateDb,
} as const;

type ServerFunctionName = keyof typeof serverFunctionMap;

export async function createFunctionCalls(request: Request, context: RequestExtensions) {
  console.log("createFunctionCalls called");
  console.log("context:", context);

  const formData = await request.formData();
  const functionName = formData.get("function") as ServerFunctionName;
  console.log("functionName:", functionName);

  if (!functionName || !(functionName in serverFunctionMap)) {
    throw new Error("Invalid function name");
  }

  await serverFunctionMap[functionName](context);
  return { success: true };
}

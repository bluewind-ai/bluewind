// app/server/actions/get-function-call.ts

import { desc } from "drizzle-orm";

import { db } from "~/db";
import { functionCalls } from "~/db/schema";

export async function getLastActionCall() {
  const result = await db.query.functionCalls.findFirst({
    orderBy: desc(functionCalls.id),
    with: {
      action: true,
      parent: true,
    },
  });
  return result;
}

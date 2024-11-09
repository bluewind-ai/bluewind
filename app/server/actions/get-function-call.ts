// app/server/actions/get-function-call.ts

import { db } from "~/db";
import { functionCalls } from "~/db/schema";
import { desc } from "drizzle-orm";

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

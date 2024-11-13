// app/server/actions/get-function-call.ts
import { desc } from "drizzle-orm";

import { functionCalls } from "~/db/schema";
import { db } from "~/middleware";

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

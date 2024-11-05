// app/server/actions/get-last-action-call.ts

import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { desc } from "drizzle-orm";

export async function getLastActionCall() {
  const result = await db.query.actionCalls.findFirst({
    orderBy: desc(actionCalls.id),
    with: {
      action: true,
      parent: true,
    },
  });
  return result;
}

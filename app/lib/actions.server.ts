// app/lib/actions.server.ts

import { db } from "~/db";
import { actionCalls, actions } from "~/db/schema";
import { and, inArray, isNull, eq, desc } from "drizzle-orm";

export async function findNextOrCreateMaster() {
  // First check for any existing action calls that need approval
  const existingActionCall = await db.query.actionCalls.findFirst({
    where: and(
      isNull(actionCalls.parentId),
      inArray(actionCalls.status, ["ready_for_approval"] as const),
    ),
    with: {
      action: true,
    },
  });

  if (existingActionCall) {
    return existingActionCall;
  }

  // If no action calls need approval, get the last action call
  const lastActionCall = await db.query.actionCalls.findFirst({
    orderBy: [desc(actionCalls.id)],
  });

  if (lastActionCall) {
    return lastActionCall;
  }

  // If no action calls exist at all, create the first master action
  const masterAction = await db.query.actions.findFirst({
    where: eq(actions.name, "master"),
  });

  const action =
    masterAction ||
    (await db.insert(actions).values({ name: "master", type: "action" }).returning())[0];

  const [newActionCall] = await db
    .insert(actionCalls)
    .values({ actionId: action.id, status: "ready_for_approval" })
    .returning();

  return newActionCall;
}

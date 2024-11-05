// app/lib/actions.server.ts

import { db } from "~/db";
import { actionCalls, actions } from "~/db/schema";
import { and, inArray, isNull, eq, desc } from "drizzle-orm";

export async function findNextOrCreateMaster() {
  console.log("=== findNextOrCreateMaster START ===");

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
  console.log("Existing action call:", existingActionCall);

  if (existingActionCall) {
    console.log("Returning existing action call");
    return existingActionCall;
  }

  // If no action calls need approval, get the last action call
  const lastActionCall = await db.query.actionCalls.findFirst({
    orderBy: [desc(actionCalls.id)],
  });
  console.log("Last action call:", lastActionCall);

  if (lastActionCall) {
    console.log("Returning last action call");
    return lastActionCall;
  }

  // If no action calls exist at all, create the first master action
  const masterAction = await db.query.actions.findFirst({
    where: eq(actions.name, "master"),
  });
  console.log("Master action:", masterAction);

  const action =
    masterAction || (await db.insert(actions).values({ name: "master" }).returning())[0];
  console.log("Action to use:", action);

  const [newActionCall] = await db
    .insert(actionCalls)
    .values({ actionId: action.id, status: "ready_for_approval" })
    .returning();

  console.log("Created new action call:", newActionCall);
  return newActionCall;
}

// app/lib/actions.server.ts

import { db } from "~/db";
import { actionCalls, actions } from "~/db/schema";
import { and, inArray, isNull, eq, desc } from "drizzle-orm";

export async function findNextOrCreateMaster() {
  void 0; // this should be removed by YOU when you rewrite the file

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
  void 0; // this should be removed by YOU when you rewrite the file

  if (existingActionCall) {
    void 0; // this should be removed by YOU when you rewrite the file
    return existingActionCall;
  }

  // If no action calls need approval, get the last action call
  const lastActionCall = await db.query.actionCalls.findFirst({
    orderBy: [desc(actionCalls.id)],
  });
  void 0; // this should be removed by YOU when you rewrite the file

  if (lastActionCall) {
    void 0; // this should be removed by YOU when you rewrite the file
    return lastActionCall;
  }

  // If no action calls exist at all, create the first master action
  const masterAction = await db.query.actions.findFirst({
    where: eq(actions.name, "master"),
  });
  void 0; // this should be removed by YOU when you rewrite the file

  const action =
    masterAction || (await db.insert(actions).values({ name: "master" }).returning())[0];
  void 0; // this should be removed by YOU when you rewrite the file

  const [newActionCall] = await db
    .insert(actionCalls)
    .values({ actionId: action.id, status: "ready_for_approval" })
    .returning();

  void 0; // this should be removed by YOU when you rewrite the file
  return newActionCall;
}

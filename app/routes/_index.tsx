// app/routes/_index.tsx

import { redirect } from "@remix-run/node";
import { path } from "~/utils/path";
import { db } from "~/db";
import { actions, ActionType, functionCalls, FunctionCallStatus } from "~/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// This should error because it's not using withMiddleware
export async function loader() {
  // First get the master action
  const masterAction = await db.query.actions.findFirst({
    where: eq(actions.name, "master"),
  });

  if (!masterAction) {
    // Create master action if it doesn't exist
    const [newMasterAction] = await db
      .insert(actions)
      .values({
        name: "master",
        type: ActionType.SYSTEM,
      })
      .returning();

    // Create its function call
    const [newFunctionCall] = await db
      .insert(functionCalls)
      .values({
        actionId: newMasterAction.id,
        status: FunctionCallStatus.READY_FOR_APPROVAL,
      })
      .returning();

    return redirect(path.to.agents(newFunctionCall.id));
  }

  // Get the root master function call
  const masterFunctionCall = await db.query.functionCalls.findFirst({
    where: and(eq(functionCalls.actionId, masterAction.id), isNull(functionCalls.parentId)),
  });

  if (!masterFunctionCall) {
    // Create master function call if it doesn't exist
    const [newFunctionCall] = await db
      .insert(functionCalls)
      .values({
        actionId: masterAction.id,
        status: FunctionCallStatus.READY_FOR_APPROVAL,
      })
      .returning();

    return redirect(path.to.agents(newFunctionCall.id));
  }

  return redirect(path.to.agents(masterFunctionCall.id));
}

export default function Index() {
  return null;
}

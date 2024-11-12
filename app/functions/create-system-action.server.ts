// app/functions/create-system-action.server.ts

import { db } from "~/db";
import { actions, ActionType } from "~/db/schema";

/**
 * Creates a system action with a specific name and returns the created record
 */
export async function createSystemAction(name: string = "test-system-action") {
  const [insertedAction] = await db
    .insert(actions)
    .values({
      name,
      type: ActionType.SYSTEM,
    })
    .returning();

  console.log("Created action:", insertedAction);

  // Query for the automatically created object record
  const objectRecord = await db.query.objects.findFirst({
    where: (fields, { and, eq }) =>
      and(eq(fields.model, "actions"), eq(fields.recordId, insertedAction.id)),
  });

  console.log("Found corresponding object record:", objectRecord);

  return {
    success: true,
    action: insertedAction,
    objectRecord,
  };
}

// app/functions/create-system-action.server.ts

import { type LoaderFunctionArgs } from "@remix-run/node";

import { ActionType, serverFunctions } from "~/db/schema";

/**
 * Creates a system action with a specific name and returns the created record
 */
export async function createSystemAction(
  args: LoaderFunctionArgs,
  name: string = "test-system-action",
) {
  const { db } = args.context;

  const [insertedAction] = await db
    .insert(serverFunctions)
    .values({
      name,
      type: ActionType.SYSTEM,
    })
    .returning();

  // this should be removed by YOU when you rewrite the filed;
  // Query for the automatically created object record
  const objectRecord = await db.query.objects.findFirst({
    where: (fields, { and, eq }) =>
      and(eq(fields.model, "actions"), eq(fields.recordId, insertedAction.id)),
  });

  // this should be removed by YOU when you rewrite the filed;
  return {
    success: true,
    action: insertedAction,
    objectRecord,
  };
}

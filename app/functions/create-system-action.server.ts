// app/functions/create-system-action.server.ts
import { type LoaderFunctionArgs } from "@remix-run/node";
import { and, eq } from "drizzle-orm";

import { ActionType, objects, serverFunctions } from "~/db/schema";

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
  const objectRecord = await db.query.objects.findFirst({
    where: () => and(eq(objects.model, "actions"), eq(objects.recordId, insertedAction.id)),
  });
  return {
    success: true,
    action: insertedAction,
    objectRecord,
  };
}

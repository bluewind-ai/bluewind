// app/functions/create-system-server-function.server.ts

import { type LoaderFunctionArgs } from "@remix-run/node";
import { and, eq } from "drizzle-orm";

import { objects, serverFunctions, ServerFunctionType, TableModel } from "~/db/schema";

export async function createSystemAction(
  args: LoaderFunctionArgs,
  name: string = "test-system-action",
) {
  const { db } = args.context;
  const request = await db.query.requests.findFirst();
  const [insertedAction] = await db
    .insert(serverFunctions)
    .values({
      name,
      type: ServerFunctionType.SYSTEM,
      requestId: request!.id,
    })
    .returning();
  const objectRecord = await db.query.objects.findFirst({
    where: () =>
      and(eq(objects.model, TableModel.SERVER_FUNCTIONS), eq(objects.recordId, insertedAction.id)),
  });
  return {
    success: true,
    action: insertedAction,
    objectRecord,
  };
}

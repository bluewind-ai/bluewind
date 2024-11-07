// app/lib/execute-action.server.ts

import type { ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/db";
import { actions } from "~/db/schema";
import { actions as actionMap } from "./generated/actions";
import { contextStore } from "./action-builder.server";
import type { ActionInsert } from "./action-builder.server";

export async function executeAction({ params }: ActionFunctionArgs) {
  const name = params.name;
  if (!name || !(name in actionMap)) {
    throw new Error(`Action ${name} not found`);
  }

  const action = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, name),
  });
  console.log("Found action in DB:", action);

  if (!action) {
    throw new Error(`Action ${name} not found in database`);
  }

  const rootCall = await db
    .insert(actionCalls)
    .values({
      actionId: action.id,
      status: "ready_for_approval",
      args: {},
    } satisfies ActionInsert)
    .returning();

  console.log("Created root call:", rootCall[0]);

  return await contextStore.run(
    {
      currentNode: {
        ...rootCall[0],
        actionName: action.name,
        children: [],
      },
      hitCount: 0,
    },
    // @ts-expect-error - This is a bug in the types
    () => actionMap[name](),
  );
}

// app/lib/action-builder.server.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncLocalStorage } from "async_hooks";
import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";
import { actions as actionMap } from "./generated/actions";
import type { ActionFunctionArgs } from "@remix-run/node";

// ... (keep all the other types and code the same until executeAction) ...

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
    () => actionMap[name](),
  );
}

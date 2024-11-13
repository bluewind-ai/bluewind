// app/lib/execute-action.server.ts

import type { ActionFunctionArgs } from "@remix-run/node";

import { functionCalls, FunctionCallStatus } from "~/db/schema";

import type { ActionContext, ActionInsert } from "./action-builder.server";
import { contextStore } from "./action-builder.server";
import { actions as actionMap } from "./generated/actions";

// Create a type from the keys of actionMap
type ActionName = keyof typeof actionMap;

export async function executeAction(args: ActionFunctionArgs) {
  const { db } = args.context;
  const name = args.params.name as ActionName;

  if (!name || !(name in actionMap)) {
    throw new Error(`Action ${name} not found`);
  }

  const action = await db.query.serverFunctions.findFirst({
    where: (fields, { eq }) => eq(fields.name, name),
  });

  // this should be removed by YOU when you rewrite the filed;
  if (!action) {
    throw new Error(`Action ${name} not found in database`);
  }

  const rootCall = await db
    .insert(functionCalls)
    .values({
      actionId: action.id,
      status: FunctionCallStatus.READY_FOR_APPROVAL,
      args: {},
    } satisfies ActionInsert)
    .returning();

  // this should be removed by YOU when you rewrite the filed;
  return await contextStore.run(
    {
      currentNode: {
        ...rootCall[0],
        actionName: action.name,
        children: [],
      },
      hitCount: 0,
    } satisfies ActionContext,
    () => actionMap[name](),
  );
}

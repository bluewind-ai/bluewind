// app/lib/execute-action.server.ts
import type { ActionFunctionArgs } from "@remix-run/node";
import { eq } from "drizzle-orm";

import { functionCalls, FunctionCallStatus, serverFunctions } from "~/db/schema";

import type { ActionContext, ActionInsert } from "./action-builder.server";
import { contextStore } from "./action-builder.server";
import { actions as actionMap } from "./generated/actions";

type ActionName = keyof typeof actionMap;
export async function executeAction(args: ActionFunctionArgs) {
  const { db } = args.context;
  const name = args.params.name as ActionName;
  if (!name || !(name in actionMap)) {
    throw new Error(`Action ${name} not found`);
  }
  const action = await db.query.serverFunctions.findFirst({
    where: () => eq(serverFunctions.name, name),
  });
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
  return await contextStore.run(
    {
      currentNode: {
        ...rootCall[0],
        actionName: action.name,
        children: [],
      },
      hitCount: 0,
    } satisfies ActionContext,
    () => actionMap[name](args),
  );
}

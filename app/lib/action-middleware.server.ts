// app/lib/action-middleware.server.ts

import { AsyncLocalStorage } from "async_hooks";

import { db } from "~/db";
import { functionCalls, FunctionCallStatus, serverFunctions } from "~/db/schema";

import { actions as actionMap } from "./generated/actions";

export type ActionCallNode = typeof functionCalls.$inferSelect & {
  actionName: string;
  children: ActionCallNode[];
};
export type Action = typeof serverFunctions.$inferSelect;
export type ActionInsert = typeof functionCalls.$inferInsert;
export type ActionContext = {
  currentNode: ActionCallNode;
  hitCount: number;
};
const contextStore = new AsyncLocalStorage<ActionContext>();
class SuspendError extends Error {
  constructor() {
    super("Action suspended for approval");
  }
}
export function withActionMiddleware(name: string, fn: () => Promise<any>) {
  return async () => {
    console.log("withActionMiddleware called for action:", name);
    const context = contextStore.getStore();
    if (!context) {
      throw new Error("Action context not initialized");
    }
    context.hitCount++;
    if (context.hitCount === 2) {
      console.log("Hit count reached 2, looking for load-csv-data action");
      const nextAction = await db.query.serverFunctions.findFirst({
        where: (fields, { eq }) => eq(fields.name, "load-csv-data"),
      });
      console.log("Found next action:", nextAction);
      if (!nextAction) return;
      const insertData: ActionInsert = {
        actionId: nextAction.id,
        parentId: context.currentNode.id,
        status: FunctionCallStatus.READY_FOR_APPROVAL,
        args: {},
      };
      const nextCall = await db.insert(functionCalls).values(insertData).returning();
      console.log("Created next function call:", nextCall);
      const currentCall = await db.query.functionCalls.findFirst({
        where: (fields, { eq }) => eq(fields.id, context.currentNode.id),
      });
      console.log("Retrieved current call:", currentCall);
      return {
        ...currentCall,
        actionName: name,
        children: [{ ...nextCall[0], actionName: nextAction.name, children: [] }],
      };
    }
    await fn();
    return context.currentNode;
  };
}
export function suspend() {
  throw new SuspendError();
}
export async function executeAction(name: keyof typeof actionMap) {
  console.log("executeAction called with name:", name);
  if (!name || !(name in actionMap)) {
    throw new Error(`Action ${name} not found`);
  }
  const action = await db.query.serverFunctions.findFirst({
    where: (fields, { eq }) => eq(fields.name, name),
  });
  console.log("Found action in database:", action);
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
  console.log("Created root function call:", rootCall);
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

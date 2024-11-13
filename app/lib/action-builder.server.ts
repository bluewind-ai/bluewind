// app/lib/action-builder.server.ts
import { AsyncLocalStorage } from "async_hooks";
import { eq } from "drizzle-orm";

import { db } from "~/db";
import { functionCalls, FunctionCallStatus } from "~/db/schema";

export type ActionCallNode = typeof functionCalls.$inferSelect & {
  actionName: string;
  children: ActionCallNode[];
};
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
    const context = contextStore.getStore();
    if (!context) {
      throw new Error("Action context not initialized");
    }
    context.hitCount++;
    await db
      .update(functionCalls)
      .set({ status: FunctionCallStatus.RUNNING })
      .where(eq(functionCalls.id, context.currentNode.id));
    context.currentNode.status = FunctionCallStatus.RUNNING;
    if (context.hitCount === 2) {
      const nextAction = await db.query.serverFunctions.findFirst({
        where: (fields, { eq }) => eq(fields.name, "load-csv-data"),
      });
      if (!nextAction) return;
      const insertData: ActionInsert = {
        actionId: nextAction.id,
        parentId: context.currentNode.id,
        status: FunctionCallStatus.READY_FOR_APPROVAL,
        args: {},
      };
      const nextCall = await db.insert(functionCalls).values(insertData).returning();
      const currentCall = await db.query.functionCalls.findFirst({
        where: (fields, { eq }) => eq(fields.id, context.currentNode.id),
      });
      context.currentNode = {
        ...currentCall!,
        actionName: context.currentNode.actionName,
        children: [{ ...nextCall[0], actionName: nextAction.name, children: [] }],
      };
    }
    await fn();
    return context.currentNode;
  };
}
export function createAction(name: string, fn: () => Promise<any>) {
  return withActionMiddleware(name, fn);
}
export function suspend() {
  throw new SuspendError();
}
export { contextStore };

// app/lib/action-middleware.server.ts
import { AsyncLocalStorage } from "async_hooks";
import { eq } from "drizzle-orm";

import { functionCalls, FunctionCallStatus, serverFunctions } from "~/db/schema";
import { db } from "~/middleware";

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
    const context = contextStore.getStore();
    if (!context) {
      throw new Error("Action context not initialized");
    }
    context.hitCount++;
    if (context.hitCount === 2) {
      const nextAction = await db.query.serverFunctions.findFirst({
        where: () => eq(serverFunctions.name, "load-csv-data"),
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
        where: () => eq(functionCalls.id, context.currentNode.id),
      });
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
export { contextStore };

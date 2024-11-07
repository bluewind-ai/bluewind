// app/lib/action-builder.server.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncLocalStorage } from "async_hooks";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";

export type ActionCallNode = typeof actionCalls.$inferSelect & {
  actionName: string;
  children: ActionCallNode[];
};

export type ActionInsert = typeof actionCalls.$inferInsert;

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
    console.log(`[${name}] Hit ${context.hitCount}`);
    console.log(`[${name}] Current node:`, context.currentNode);

    if (context.hitCount === 2) {
      const nextAction = await db.query.actions.findFirst({
        where: (fields, { eq }) => eq(fields.name, "load-csv-data"),
      });

      console.log(`[${name}] Found next action:`, nextAction);
      if (!nextAction) return;

      const insertData: ActionInsert = {
        actionId: nextAction.id,
        parentId: context.currentNode.id,
        status: "ready_for_approval",
        args: {},
      };

      const nextCall = await db.insert(actionCalls).values(insertData).returning();
      console.log(`[${name}] Created next call:`, nextCall[0]);

      const currentCall = await db.query.actionCalls.findFirst({
        where: (fields, { eq }) => eq(fields.id, context.currentNode.id),
      });

      context.currentNode = {
        ...currentCall!,
        actionName: name,
        children: [{ ...nextCall[0], actionName: nextAction.name, children: [] }],
      };
    }

    console.log(`[${name}] Executing function`);
    try {
      await fn();
      console.log(`[${name}] Function executed successfully`);

      return context.currentNode;
    } catch (error) {
      console.log(`[${name}] Caught suspend error`);
      if (error instanceof SuspendError) {
        return context.currentNode;
      }
      throw error;
    }
  };
}

export function createAction(name: string, fn: () => Promise<any>) {
  return withActionMiddleware(name, fn);
}

export function suspend() {
  throw new SuspendError();
}

export { contextStore }; // Export for executeAction to use

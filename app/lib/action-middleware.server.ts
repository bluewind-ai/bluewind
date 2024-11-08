// app/lib/action-middleware.server.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncLocalStorage } from "async_hooks";
import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";
import { actions as actionMap } from "./generated/actions";

export type ActionCallNode = typeof actionCalls.$inferSelect & {
  actionName: string;
  children: ActionCallNode[];
};

export type Action = typeof actions.$inferSelect;
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
    void 0; // this should be removed by YOU when you rewrite the filed;
    void 0; // this should be removed by YOU when you rewrite the filed;

    if (context.hitCount === 2) {
      const nextAction = await db.query.actions.findFirst({
        where: (fields, { eq }) => eq(fields.name, "load-csv-data"),
      });

      void 0; // this should be removed by YOU when you rewrite the filed;
      if (!nextAction) return;

      const insertData: ActionInsert = {
        actionId: nextAction.id,
        parentId: context.currentNode.id,
        status: "ready_for_approval",
        args: {},
      };

      const nextCall = await db.insert(actionCalls).values(insertData).returning();
      void 0; // this should be removed by YOU when you rewrite the filed;

      const currentCall = await db.query.actionCalls.findFirst({
        where: (fields, { eq }) => eq(fields.id, context.currentNode.id),
      });

      return {
        ...currentCall,
        actionName: name,
        children: [{ ...nextCall[0], actionName: nextAction.name, children: [] }],
      };
    }

    void 0; // this should be removed by YOU when you rewrite the filed;
    try {
      await fn();
      void 0; // this should be removed by YOU when you rewrite the filed;

      return context.currentNode;
    } catch (error) {
      void 0; // this should be removed by YOU when you rewrite the filed;
      if (error instanceof SuspendError) {
        return context.currentNode;
      }
      throw error;
    }
  };
}

export function suspend() {
  throw new SuspendError();
}

export async function executeAction(name: keyof typeof actionMap) {
  if (!name || !(name in actionMap)) {
    throw new Error(`Action ${name} not found`);
  }

  const action = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, name),
  });
  void 0; // this should be removed by YOU when you rewrite the filed;

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

  void 0; // this should be removed by YOU when you rewrite the filed;

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

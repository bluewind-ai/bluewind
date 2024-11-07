// app/lib/action-middleware.server.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncLocalStorage } from "async_hooks";
import { type ActionFunction, type ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";

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

export function withActionMiddleware(name: string, actionFn: ActionFunction): ActionFunction {
  return async (args) => {
    const context = contextStore.getStore();
    if (!context) {
      throw new Error("Action context not initialized");
    }

    context.hitCount++;
    console.log(`[${name}] Hit ${context.hitCount}`);
    console.log(`[${name}] Current node:`, context.currentNode);

    if (context.hitCount === 2) {
      console.log(`[${name}] Hit 2 - Loading loadCsvData action`);
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

      return {
        ...currentCall,
        actionName: name,
        children: [{ ...nextCall[0], actionName: nextAction.name, children: [] }],
      };
    }

    console.log(`[${name}] Executing function`);
    try {
      await actionFn(args);
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

export function suspend() {
  throw new SuspendError();
}

export async function executeAction(args: ActionFunctionArgs) {
  const actionName = args.params.name;

  const action = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, actionName),
  });
  console.log("Found action in DB:", action);

  if (!action) {
    throw new Error(`Action ${actionName} not found in database`);
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

  // Dynamic import of the specific action
  const module = await import(`~/actions/${actionName}.server`);
  const actionFn = module[actionName];

  return await contextStore.run(
    {
      currentNode: {
        ...rootCall[0],
        actionName: action.name,
        children: [],
      },
      hitCount: 0,
    },
    () => actionFn(args),
  );
}

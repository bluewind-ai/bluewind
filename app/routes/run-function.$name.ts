// app/routes/run-function.$name.ts

import { type ActionFunctionArgs } from "@remix-run/node";
import { eq } from "drizzle-orm";

import { db } from "~/db";
import { functionCalls } from "~/db/schema";
import { type ActionContext, contextStore } from "~/lib/action-builder.server";
import { actions } from "~/lib/actions.server";
import { actionMiddleware } from "~/lib/middleware";

async function _action(args: ActionFunctionArgs) {
  const name = args.params.name as keyof typeof actions;

  const functionCall = await db.query.functionCalls.findFirst({
    where: eq(functionCalls.id, 1), // For now use master call
    with: {
      action: true,
    },
  });

  if (!functionCall) {
    throw new Error("Function call not found");
  }

  // Initialize the context
  const context: ActionContext = {
    currentNode: {
      ...functionCall,
      actionName: functionCall.action.name,
      children: [],
    },
    hitCount: 0,
  };

  // Run the action inside the context
  return await contextStore.run(context, async () => {
    const action = actions[name];
    if (!action) {
      throw new Error(`Action ${name} not found`);
    }
    return await action();
  });
}

export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}

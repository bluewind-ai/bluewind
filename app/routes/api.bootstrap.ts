// app/routes/api.bootstrap.ts

import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "~/db/schema";
import { functionCalls, serverFunctions } from "~/db/schema";
import { ActionType, FunctionCallStatus } from "~/db/schema/types";
import { actionMiddleware } from "~/lib/middleware";

type DbClient = PostgresJsDatabase<typeof schema>;

async function _action(args: ActionFunctionArgs) {
  const { trx } = args.context;
  const db = trx as DbClient;

  const [masterAction] = await db
    .insert(serverFunctions)
    .values({
      name: "master",
      type: ActionType.SYSTEM,
    })
    .returning();

  await db
    .insert(functionCalls)
    .values({
      actionId: masterAction.id,
      status: FunctionCallStatus.READY_FOR_APPROVAL,
    })
    .returning();

  await new Promise((resolve) => setTimeout(resolve, 1));

  // Log the full args.context to see what's actually in there
  console.log("\nFINAL ROUTE CONTEXT:", {
    fullContext: args.context,
    request: args.request,
    params: args.params,
  });

  return redirect("/");
}

export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}

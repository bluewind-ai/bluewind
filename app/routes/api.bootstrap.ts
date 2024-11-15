// app/routes/api.bootstrap.ts
import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "~/db/schema";
import { functionCalls, FunctionCallStatus } from "~/db/schema";

type DbClient = PostgresJsDatabase<typeof schema>;
async function _action(args: ActionFunctionArgs) {
  const { trx } = args.context;
  const db = trx as DbClient;
  const request = await db.query.requests.findFirst();
  if (!request) {
    throw new Error("No request found");
  }
  const [masterAction] = await db
    .insert(schema.serverFunctions)
    .values({
      requestId: request.id,
      name: "master",
      type: schema.ServerFunctionType.SYSTEM,
    })
    .returning();
  await db
    .insert(functionCalls)
    .values({
      requestId: request.id,
      actionId: masterAction.id,
      status: FunctionCallStatus.READY_FOR_APPROVAL,
    })
    .returning();
  await new Promise((resolve) => setTimeout(resolve, 1));
  return redirect("/");
}
export async function action(args: ActionFunctionArgs) {
  const response = await _action(args);
  return response;
}

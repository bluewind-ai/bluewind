// app/routes/api.truncate-db.ts
import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { type PgTable } from "drizzle-orm/pg-core";

import {
  debugLogs,
  functionCalls,
  objects,
  requestErrors,
  requests,
  serverFunctions as actions,
  sessions,
  TABLES,
  users,
} from "~/db/schema";
import { actionMiddleware } from "~/lib/middleware";

async function _action(args: ActionFunctionArgs) {
  const { db } = args.context;
  const tableMap: Record<string, PgTable<any>> = {
    functionCalls,
    actions,
    objects,
    requestErrors,
    debugLogs,
    sessions,
    users,
    requests,
  };
  for (const tableName in TABLES) {
    await db.delete(tableMap[tableName]).returning();
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
  return redirect("/");
}
export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}

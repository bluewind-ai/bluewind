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

  console.log("Truncating all database tables...");

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
    console.log(`Truncating table: ${tableName}`);

    if (tableName in tableMap) {
      await db.delete(tableMap[tableName]).returning();
      console.log(`Successfully truncated ${tableName}`);
    } else {
      console.log(`Skipping ${tableName} - no table reference found`);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 0));
  console.log("Database truncation complete");
  return redirect("/");
}

export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}

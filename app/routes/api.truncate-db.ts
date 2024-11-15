// app/routes/api.truncate-db.ts

import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { type PgTable } from "drizzle-orm/pg-core";

import {
  debugLogs,
  functionCalls,
  objects,
  requestErrors,
  requests,
  serverFunctions,
  sessions,
  TABLES,
  users,
} from "~/db/schema";
import { DbClient } from "~/middleware";

async function _action(args: ActionFunctionArgs) {
  const { trx } = args.context;
  const db = trx as DbClient;
  const tableMap: Record<string, PgTable<any>> = {
    functionCalls,
    actions: serverFunctions, // Map it directly here
    objects,
    requestErrors,
    debugLogs,
    sessions,
    users,
    requests,
  };

  console.log("Starting DB truncation...");

  for (const tableName in TABLES) {
    console.log(`Attempting to truncate ${tableName}...`);
    const result = await db.delete(tableMap[tableName]).returning();
    console.log(`Successfully truncated ${tableName}, deleted ${result.length} rows`);
  }

  console.log("All tables truncated, waiting 0ms...");
  await new Promise((resolve) => setTimeout(resolve, 0));
  console.log("Finished waiting, redirecting...");

  return redirect("/");
}

export async function action(args: ActionFunctionArgs) {
  return await _action(args);
}

// app/functions/truncate-db.server.ts

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
import type { RequestExtensions } from "~/middleware";

export async function truncateDb(request: RequestExtensions) {
  const db = request.db;
  const tableMap: Record<string, PgTable<any>> = {
    functionCalls,
    serverFunctions,
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
}

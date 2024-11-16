// app/functions/truncate-db.server.ts
import { type PgTable } from "drizzle-orm/pg-core";

import {
  debugLogs,
  functionCalls,
  models,
  objects,
  requestErrors,
  requests,
  serverFunctions,
  sessions,
  users,
} from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

import { seedModels } from "./seed-models.server";

export async function truncateDb(request: RequestExtensions) {
  const db = request.db;
  // Create tableMap dynamically from schema
  const tableMap: Record<string, PgTable<any>> = {
    users,
    sessions,
    serverFunctions,
    functionCalls,
    requestErrors,
    debugLogs,
    objects,
    requests,
    models,
  };
  for (const tableName of Object.keys(tableMap)) {
    const table = tableMap[tableName];
    if (!table) {
      continue;
    }
    await db.delete(table).returning();
  }
  // Reseed models
  await seedModels(request);
}

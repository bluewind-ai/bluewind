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
  TABLES,
  users,
} from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

import { seedModels } from "./seed-models.server";

export async function truncateDb(request: RequestExtensions) {
  console.log("truncateDb called with request:", request);
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

  console.log("Processing tables:", Object.keys(TABLES));

  for (const tableName of Object.keys(tableMap)) {
    console.log(`Truncating table: ${tableName}`);
    const table = tableMap[tableName];
    if (!table) {
      console.log(`Warning: No table found for ${tableName}`);
      continue;
    }
    await db.delete(table).returning();
  }

  // Reseed models
  await seedModels(request);
}

// app/functions/count-tables.server.ts

import { sql } from "drizzle-orm";
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
import type { DbClient } from "~/middleware";

export async function countTables(trx: DbClient) {
  const tableMap: Record<string, PgTable<any>> = {
    functionCalls,
    serverFunctions,
    requestErrors,
    debugLogs,
    sessions,
    users,
    requests,
  };
  const counts: Record<string, number> = {};
  let totalCount = 0;
  for (const tableName in TABLES) {
    if (tableName === TABLES.objects.urlName || tableName === "models") continue;
    const result = await trx.select({ count: sql<number>`count(*)` }).from(tableMap[tableName]);
    counts[tableName] = Number(result[0].count);
    totalCount += counts[tableName];
  }
  const objectsResult = await trx.select({ count: sql<number>`count(*)` }).from(objects);
  const objectsCount = Number(objectsResult[0].count);
  if (totalCount !== objectsCount) {
    throw new Error(`
MISMATCH FOUND!
Total records across tables: ${totalCount}
Objects table count: ${objectsCount}
Difference: ${Math.abs(totalCount - objectsCount)}
Table counts:
${JSON.stringify(counts, null, 2)}
    `);
  }
  return {
    tableCounts: counts,
    totalCount,
    objectsCount,
    matches: true,
  };
}

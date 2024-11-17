// app/functions/count-tables.server.ts
import { sql } from "drizzle-orm";
import { type PgTable } from "drizzle-orm/pg-core";

import {
  functionCalls,
  models,
  objects,
  requests,
  serverFunctions,
  sessions,
  users,
} from "~/db/schema";
import { TABLES } from "~/db/schema/table-models";
import type { DbClient } from "~/middleware";

const schemaMap: Record<keyof typeof TABLES, PgTable<any>> = {
  users,
  sessions,
  serverFunctions,
  functionCalls,
  objects,
  requests,
  models,
};
export async function countTables(trx: DbClient) {
  const counts: Record<string, number> = {};
  let totalCount = 0;
  for (const [key, config] of Object.entries(TABLES)) {
    if (config.urlName === TABLES.objects.urlName) continue;
    const result = await trx
      .select({ count: sql<number>`count(*)` })
      .from(schemaMap[key as keyof typeof TABLES]);
    counts[key] = Number(result[0].count);
    totalCount += counts[key];
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

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
  console.log("🔍 Starting countTables check...");
  const counts: Record<string, number> = {};
  let totalCount = 0;

  for (const [key, config] of Object.entries(TABLES)) {
    if (config.urlName === TABLES.objects.urlName) continue;
    const result = await trx
      .select({ count: sql<number>`count(*)` })
      .from(schemaMap[key as keyof typeof TABLES]);
    counts[key] = Number(result[0].count);
    totalCount += counts[key];
    console.log(`📊 Count for ${key}: ${counts[key]}`);
  }

  const objectsResult = await trx.select({ count: sql<number>`count(*)` }).from(objects);
  const objectsCount = Number(objectsResult[0].count);
  console.log(`📊 Objects table count: ${objectsCount}`);
  console.log(`📊 Total count across other tables: ${totalCount}`);

  if (totalCount !== objectsCount) {
    console.log("❌ Mismatch found in counts!");
    throw new Error(`
MISMATCH FOUND!
Total records across tables: ${totalCount}
Objects table count: ${objectsCount}
Difference: ${Math.abs(totalCount - objectsCount)}
Table counts:
${JSON.stringify(counts, null, 2)}
    `);
  }

  console.log("✅ Counts match successfully!");
  return {
    tableCounts: counts,
    totalCount,
    objectsCount,
    matches: true,
  };
}

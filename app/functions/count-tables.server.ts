// app/functions/count-tables.server.ts

import { sql } from "drizzle-orm";

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

export async function countTables(trx: DbClient) {
  const counts: Record<string, number> = {};
  let totalCount = 0;

  // Count everything except objects first
  const tableMap = {
    users,
    sessions,
    serverFunctions,
    functionCalls,
    requests,
    models,
  };

  for (const [key, config] of Object.entries(TABLES)) {
    if (config.urlName === TABLES.objects.urlName) continue;
    const result = await trx
      .select({ count: sql<number>`count(*)` })
      .from(tableMap[key as keyof typeof tableMap]);
    counts[key] = Number(result[0].count);
    totalCount += counts[key];
    console.log(`📊 Count for ${key}: ${counts[key]}`);
  }

  // Count objects
  const result = await trx.select({ count: sql<number>`count(*)` }).from(objects);
  const objectsCount = Number(result[0].count);
  console.log(`📊 Objects table count: ${objectsCount}`);
  console.log(`📊 Total count across other tables: ${totalCount}`);

  // We need one object per record (totalCount)
  const expectedObjectsCount = totalCount;

  if (objectsCount !== expectedObjectsCount) {
    console.log("❌ Mismatch found in counts!");
    throw new Error(`
MISMATCH FOUND!
Total records across tables: ${totalCount}
Expected objects count: ${expectedObjectsCount}
Actual objects count: ${objectsCount}
Difference: ${Math.abs(expectedObjectsCount - objectsCount)}
Table counts:
${JSON.stringify(counts, null, 2)}
    `);
  }
}

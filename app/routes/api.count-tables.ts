// app/routes/api.count-tables.ts
import { type LoaderFunctionArgs } from "@remix-run/node";
import { sql } from "drizzle-orm";
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
import { loaderMiddleware } from "~/lib/middleware";
import type { DbClient } from "~/middleware";

async function _loader(args: LoaderFunctionArgs) {
  const context = args.context;
  const trx = context.trx as DbClient;
  const tableMap: Record<string, PgTable<any>> = {
    functionCalls,
    actions,
    requestErrors,
    debugLogs,
    sessions,
    users,
    requests,
  };
  const counts: Record<string, number> = {};
  let totalCount = 0;
  // Count all tables except objects
  for (const tableName in TABLES) {
    if (tableName === TABLES.objects.urlName) continue;
    const result = await trx.select({ count: sql<number>`count(*)` }).from(tableMap[tableName]);
    counts[tableName] = Number(result[0].count);
    totalCount += counts[tableName];
  }
  // Count objects table
  const objectsResult = await trx.select({ count: sql<number>`count(*)` }).from(objects);
  const objectsCount = Number(objectsResult[0].count);
  if (totalCount !== objectsCount) {
    throw new Error(
      `Object count mismatch!\n` +
        `Total records across tables: ${totalCount}\n` +
        `Objects table count: ${objectsCount}\n` +
        `Table counts:\n${JSON.stringify(counts, null, 2)}`,
    );
  }
  return Response.json({
    tableCounts: counts,
    totalCount,
    objectsCount,
    matches: true,
  });
}
export async function loader(args: LoaderFunctionArgs) {
  return await loaderMiddleware(args, () => _loader(args));
}

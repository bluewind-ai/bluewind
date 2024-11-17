// app/functions/get-debug-logs.server.ts

import { sql } from "drizzle-orm";
import { debugLogs } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getDebugLogs(request: RequestExtensions, url: string) {
  console.log("getdebugLogs called with URL:", url);

  const requestId = url.split("request-id=")[1];
  console.log("Parsed requestId:", requestId);

  let query = request.db.query.debugLogs.findMany({
    orderBy: debugLogs.id,
  });

  if (requestId) {
    console.log("Filtering by requestId:", parseInt(requestId, 10));
    query = request.db.query.debugLogs.findMany({
      where: sql`${debugLogs.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: debugLogs.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}
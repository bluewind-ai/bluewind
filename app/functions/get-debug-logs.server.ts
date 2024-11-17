// app/functions/get-debug-logs.server.ts

import { sql } from "drizzle-orm";

import { debugLogs } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getDebugLogs(request: RequestExtensions, url: string) {
  console.log("getdebugLogs called with URL:", url);

  const functionCallId = url.split("function-call-id=")[1];
  console.log("Parsed functionCallId:", functionCallId);

  let query = request.db.query.debugLogs.findMany({
    orderBy: debugLogs.id,
  });

  if (functionCallId) {
    console.log("Filtering by functionCallId:", parseInt(functionCallId, 10));
    query = request.db.query.debugLogs.findMany({
      where: sql`${debugLogs.functionCallId} = ${parseInt(functionCallId, 10)}`,
      orderBy: debugLogs.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}

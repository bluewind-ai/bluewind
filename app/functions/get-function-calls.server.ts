// app/functions/get-function-calls.server.ts

import { sql } from "drizzle-orm";
import { functionCalls } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getFunctionCalls(request: RequestExtensions, url: string) {
  console.log("getfunctionCalls called with URL:", url);

  const requestId = url.split("request-id=")[1];
  console.log("Parsed requestId:", requestId);

  let query = request.db.query.functionCalls.findMany({
    orderBy: functionCalls.id,
  });

  if (requestId) {
    console.log("Filtering by requestId:", parseInt(requestId, 10));
    query = request.db.query.functionCalls.findMany({
      where: sql`${functionCalls.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: functionCalls.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}
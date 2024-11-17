// app/functions/get-function-calls.server.ts

import { sql } from "drizzle-orm";

import { functionCalls } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getFunctionCalls(request: RequestExtensions, url: string) {
  console.log("getfunctionCalls called with URL:", url);

  const functionCallId = url.split("function-call-id=")[1];
  console.log("Parsed functionCallId:", functionCallId);

  let query = request.db.query.functionCalls.findMany({
    orderBy: functionCalls.id,
  });

  if (functionCallId) {
    console.log("Filtering by functionCallId:", parseInt(functionCallId, 10));
    query = request.db.query.functionCalls.findMany({
      where: sql`${functionCalls.functionCallId} = ${parseInt(functionCallId, 10)}`,
      orderBy: functionCalls.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}

// app/functions/get-function-calls.server.ts
import { sql } from "drizzle-orm";

import { functionCalls } from "~/db/schema";
import type { ExtendedContext } from "~/middleware";

export async function getFunctionCalls(request: ExtendedContext, url: string) {
  const requestId = url.split("request-id=")[1];
  let query = request.db.query.functionCalls.findMany({
    orderBy: functionCalls.id,
  });
  if (requestId) {
    query = request.db.query.functionCalls.findMany({
      where: sql`${functionCalls.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: functionCalls.id,
    });
  }
  const result = await query;
  return result;
}

// app/functions/get-request-errors.server.ts

import { sql } from "drizzle-orm";

import { requestErrors } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getRequestErrors(request: RequestExtensions, url: string) {
  console.log("getrequestErrors called with URL:", url);

  const functionCallId = url.split("function-call-id=")[1];
  console.log("Parsed functionCallId:", functionCallId);

  let query = request.db.query.requestErrors.findMany({
    orderBy: requestErrors.id,
  });

  if (functionCallId) {
    console.log("Filtering by functionCallId:", parseInt(functionCallId, 10));
    query = request.db.query.requestErrors.findMany({
      where: sql`${requestErrors.functionCallId} = ${parseInt(functionCallId, 10)}`,
      orderBy: requestErrors.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}

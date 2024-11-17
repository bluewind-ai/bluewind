// app/functions/get-request-errors.server.ts

import { sql } from "drizzle-orm";
import { requestErrors } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getRequestErrors(request: RequestExtensions, url: string) {
  console.log("getrequestErrors called with URL:", url);

  const requestId = url.split("request-id=")[1];
  console.log("Parsed requestId:", requestId);

  let query = request.db.query.requestErrors.findMany({
    orderBy: requestErrors.id,
  });

  if (requestId) {
    console.log("Filtering by requestId:", parseInt(requestId, 10));
    query = request.db.query.requestErrors.findMany({
      where: sql`${requestErrors.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: requestErrors.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}
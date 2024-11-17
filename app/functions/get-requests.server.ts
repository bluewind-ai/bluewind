// app/functions/get-requests.server.ts

import { sql } from "drizzle-orm";

import { requests } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getRequests(request: RequestExtensions, url: string) {
  console.log("getrequests called with URL:", url);

  const requestId = url.split("request-id=")[1];
  console.log("Parsed requestId:", requestId);

  let query = request.db.query.requests.findMany({
    orderBy: requests.id,
  });

  if (requestId) {
    console.log("Filtering by requestId:", parseInt(requestId, 10));
    query = request.db.query.requests.findMany({
      where: sql`${requests.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: requests.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}

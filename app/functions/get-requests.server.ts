// app/functions/get-requests.server.ts

import { sql } from "drizzle-orm";

import { requests } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getRequests(request: RequestExtensions, url: string) {
  console.log("getrequests called with URL:", url);

  const functionCallId = url.split("function-call-id=")[1];
  console.log("Parsed functionCallId:", functionCallId);

  let query = request.db.query.requests.findMany({
    orderBy: requests.id,
  });

  if (functionCallId) {
    console.log("Filtering by functionCallId:", parseInt(functionCallId, 10));
    query = request.db.query.requests.findMany({
      where: sql`${requests.functionCallId} = ${parseInt(functionCallId, 10)}`,
      orderBy: requests.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}

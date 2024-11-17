// app/functions/get-sessions.server.ts

import { sql } from "drizzle-orm";

import { sessions } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getSessions(request: RequestExtensions, url: string) {
  console.log("getsessions called with URL:", url);

  const requestId = url.split("request-id=")[1];
  console.log("Parsed requestId:", requestId);

  let query = request.db.query.sessions.findMany({
    orderBy: sessions.id,
  });

  if (requestId) {
    console.log("Filtering by requestId:", parseInt(requestId, 10));
    query = request.db.query.sessions.findMany({
      where: sql`${sessions.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: sessions.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}
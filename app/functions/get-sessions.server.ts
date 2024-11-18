// app/functions/get-sessions.server.ts
import { sql } from "drizzle-orm";

import { sessions } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getSessions(request: RequestExtensions, url: string) {
  const requestId = url.split("request-id=")[1];
  let query = request.db.query.sessions.findMany({
    orderBy: sessions.id,
  });
  if (requestId) {
    query = request.db.query.sessions.findMany({
      where: sql`${sessions.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: sessions.id,
    });
  }
  const result = await query;
  return result;
}

// app/functions/get-objects.server.ts
import { sql } from "drizzle-orm";

import { objects } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getObjects(request: RequestExtensions, url: string) {
  const requestId = url.split("request-id=")[1];
  let query = request.db.query.objects.findMany({
    orderBy: objects.id,
  });
  if (requestId) {
    query = request.db.query.objects.findMany({
      where: sql`${objects.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: objects.id,
    });
  }
  const result = await query;
  return result;
}

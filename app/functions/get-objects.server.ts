// app/functions/get-objects.server.ts

import { sql } from "drizzle-orm";

import { objects } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getObjects(request: RequestExtensions, url: string) {
  console.log("getobjects called with URL:", url);

  const requestId = url.split("request-id=")[1];
  console.log("Parsed requestId:", requestId);

  let query = request.db.query.objects.findMany({
    orderBy: objects.id,
  });

  if (requestId) {
    console.log("Filtering by requestId:", parseInt(requestId, 10));
    query = request.db.query.objects.findMany({
      where: sql`${objects.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: objects.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}

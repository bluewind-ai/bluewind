// app/functions/get-models.server.ts

import { models } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getModels(request: RequestExtensions, url: string) {
  console.log("getmodels called with URL:", url);

  const requestId = url.split("request-id=")[1];
  console.log("Parsed requestId:", requestId);

  let query = request.db.query.models.findMany({
    orderBy: models.id,
  });

  if (requestId) {
    console.log("Filtering by requestId:", parseInt(requestId, 10));
    query = request.db.query.models.findMany({
      // where: sql`${models.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: models.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}
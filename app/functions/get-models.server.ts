// app/functions/get-models.server.ts

import { sql } from "drizzle-orm";

import { models } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getModels(request: RequestExtensions, url: string) {
  console.log("getmodels called with URL:", url);

  const functionCallId = url.split("function-call-id=")[1];
  console.log("Parsed functionCallId:", functionCallId);

  let query = request.db.query.models.findMany({
    orderBy: models.id,
  });

  if (functionCallId) {
    console.log("Filtering by functionCallId:", parseInt(functionCallId, 10));
    query = request.db.query.models.findMany({
      where: sql`${models.functionCallId} = ${parseInt(functionCallId, 10)}`,
      orderBy: models.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}

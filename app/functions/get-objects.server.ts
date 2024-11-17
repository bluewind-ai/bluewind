// app/functions/get-objects.server.ts

import { sql } from "drizzle-orm";

import { objects } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getObjects(request: RequestExtensions, url: string) {
  console.log("getObjects called with URL:", url);

  const functionCallId = url.split("function-call-id=")[1];
  console.log("Parsed functionCallId:", functionCallId);

  let query = request.db.query.objects.findMany({
    orderBy: objects.id,
  });

  if (functionCallId) {
    console.log("Filtering by functionCallId:", parseInt(functionCallId, 10));
    query = request.db.query.objects.findMany({
      where: sql`${objects.functionCallId} = ${parseInt(functionCallId, 10)}`,
      orderBy: objects.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}

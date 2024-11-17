// app/functions/get-sessions.server.ts

import { sql } from "drizzle-orm";

import { sessions } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getSessions(request: RequestExtensions, url: string) {
  console.log("getsessions called with URL:", url);

  const functionCallId = url.split("function-call-id=")[1];
  console.log("Parsed functionCallId:", functionCallId);

  let query = request.db.query.sessions.findMany({
    orderBy: sessions.id,
  });

  if (functionCallId) {
    console.log("Filtering by functionCallId:", parseInt(functionCallId, 10));
    query = request.db.query.sessions.findMany({
      where: sql`${sessions.functionCallId} = ${parseInt(functionCallId, 10)}`,
      orderBy: sessions.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}

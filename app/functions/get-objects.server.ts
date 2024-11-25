// app/functions/get-objects.server.ts
import { sql } from "drizzle-orm";

import { objects } from "~/db/schema";
import type { ExtendedContext } from "~/middleware";

export async function getObjects(request: ExtendedContext, url: string) {
  const urlParams = new URL(url).searchParams;
  const requestId = urlParams.get("request-id");
  const functionCallId = urlParams.get("function-call-id");
  let query = request.db.query.objects.findMany({
    orderBy: objects.id,
  });
  if (requestId) {
    query = request.db.query.objects.findMany({
      where: sql`${objects.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: objects.id,
    });
  }
  if (functionCallId) {
    query = request.db.query.objects.findMany({
      where: sql`${objects.functionCallId} = ${parseInt(functionCallId, 10)}`,
      orderBy: objects.id,
    });
  }
  const result = await query;
  return result;
}

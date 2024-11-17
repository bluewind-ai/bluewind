// app/functions/get-server-functions.server.ts

import { sql } from "drizzle-orm";

import { serverFunctions } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getServerFunctions(request: RequestExtensions, url: string) {
  console.log("getserverFunctions called with URL:", url);

  const functionCallId = url.split("function-call-id=")[1];
  console.log("Parsed functionCallId:", functionCallId);

  let query = request.db.query.serverFunctions.findMany({
    orderBy: serverFunctions.id,
  });

  if (functionCallId) {
    console.log("Filtering by functionCallId:", parseInt(functionCallId, 10));
    query = request.db.query.serverFunctions.findMany({
      where: sql`${serverFunctions.functionCallId} = ${parseInt(functionCallId, 10)}`,
      orderBy: serverFunctions.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}

// app/functions/get-server-functions.server.ts

import { sql } from "drizzle-orm";

import { serverFunctions } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getServerFunctions(request: RequestExtensions, url: string) {
  console.log("getserverFunctions called with URL:", url);

  const requestId = url.split("request-id=")[1];
  console.log("Parsed requestId:", requestId);

  let query = request.db.query.serverFunctions.findMany({
    orderBy: serverFunctions.id,
  });

  if (requestId) {
    console.log("Filtering by requestId:", parseInt(requestId, 10));
    query = request.db.query.serverFunctions.findMany({
      where: sql`${serverFunctions.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: serverFunctions.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}

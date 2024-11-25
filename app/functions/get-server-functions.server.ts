// app/functions/get-server-functions.server.ts
import { sql } from "drizzle-orm";

import { serverFunctions } from "~/db/schema";
import type { ExtendedContext } from "~/middleware";

export async function getServerFunctions(request: ExtendedContext, url: string) {
  const requestId = url.split("request-id=")[1];
  let query = request.db.query.serverFunctions.findMany({
    orderBy: serverFunctions.id,
  });
  if (requestId) {
    query = request.db.query.serverFunctions.findMany({
      where: sql`${serverFunctions.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: serverFunctions.id,
    });
  }
  const result = await query;
  return result;
}

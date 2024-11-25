// app/functions/get-users.server.ts
import { sql } from "drizzle-orm";

import { users } from "~/db/schema";
import type { ExtendedContext } from "~/middleware";

export async function getUsers(request: ExtendedContext, url: string) {
  const requestId = url.split("request-id=")[1];
  let query = request.db.query.users.findMany({
    orderBy: users.id,
  });
  if (requestId) {
    query = request.db.query.users.findMany({
      where: sql`${users.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: users.id,
    });
  }
  const result = await query;
  return result;
}

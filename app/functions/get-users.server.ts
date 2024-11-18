// app/functions/get-users.server.ts

import { sql } from "drizzle-orm";
import { users } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getUsers(request: RequestExtensions, url: string) {
  console.log("getusers called with URL:", url);

  const requestId = url.split("request-id=")[1];
  console.log("Parsed requestId:", requestId);

  let query = request.db.query.users.findMany({
    orderBy: users.id,
  });

  if (requestId) {
    console.log("Filtering by requestId:", parseInt(requestId, 10));
    query = request.db.query.users.findMany({
      where: sql`${users.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: users.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}
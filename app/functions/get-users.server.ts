// app/functions/get-users.server.ts

import { sql } from "drizzle-orm";

import { users } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getUsers(request: RequestExtensions, url: string) {
  console.log("getusers called with URL:", url);

  const functionCallId = url.split("function-call-id=")[1];
  console.log("Parsed functionCallId:", functionCallId);

  let query = request.db.query.users.findMany({
    orderBy: users.id,
  });

  if (functionCallId) {
    console.log("Filtering by functionCallId:", parseInt(functionCallId, 10));
    query = request.db.query.users.findMany({
      where: sql`${users.functionCallId} = ${parseInt(functionCallId, 10)}`,
      orderBy: users.id,
    });
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}

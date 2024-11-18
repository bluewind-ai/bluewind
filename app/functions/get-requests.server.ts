// app/functions/get-requests.server.ts

import { sql } from "drizzle-orm";
import { requests } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getRequests(request: RequestExtensions, url: string) {
  console.log("getrequests called with URL:", url);

  

  let query = request.db.query.requests.findMany({
    orderBy: requests.id,
  });

  

  const result = await query;
  console.log("Query result:", result);
  return result;
}
// app/middleware/retrieve-cache.ts

import { eq } from "drizzle-orm";

import { requests } from "~/db/schema";

import { db } from "./main";

export async function retrieveCache(pathname: string) {
  const existingRequest = await db
    .select()
    .from(requests)
    .where(eq(requests.pathname, pathname))
    .limit(1);

  if (existingRequest.length > 0 && existingRequest[0].response) {
    return JSON.parse(existingRequest[0].response);
  }

  return null;
}

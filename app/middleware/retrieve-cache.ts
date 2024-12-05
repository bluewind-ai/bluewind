// app/middleware/retrieve-cache.ts

import { desc, eq } from "drizzle-orm";

import { requests } from "~/db/schema";

import { db } from "./main";

type CacheResult = {
  hit: boolean;
  response: any;
};

export async function retrieveCache(
  pathname: string,
  method: string,
  payload: any,
): Promise<CacheResult> {
  if (!payload || Object.keys(payload).length === 0) {
    return { hit: false, response: null };
  }

  console.log("[Cache] Looking for:", { pathname, method, payload });

  const request = await db
    .select()
    .from(requests)
    .where(eq(requests.pathname, pathname))
    .orderBy(desc(requests.id))
    .limit(1);

  console.log("[Cache] Found:", request[0] || "none");

  const foundRequest = request[0];
  if (foundRequest?.response) {
    const payloadsMatch = JSON.stringify(foundRequest.payload) === JSON.stringify(payload);

    if (payloadsMatch) {
      console.log("[Cache] Hit!");
      return {
        hit: true,
        response: JSON.parse(foundRequest.response),
      };
    }
  }
  console.log("[Cache] Miss");
  return {
    hit: false,
    response: null,
  };
}

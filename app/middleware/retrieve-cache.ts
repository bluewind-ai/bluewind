// app/middleware/retrieve-cache.ts

import { desc, eq } from "drizzle-orm";

import { requests } from "~/db/schema";

import { db } from "./main";

type CacheResult = {
  hit: boolean;
  response: any;
};

function normalizePayload(payload: any): string {
  return JSON.stringify(payload, Object.keys(payload).sort());
}

export async function retrieveCache(
  pathname: string,
  method: string,
  payload: any,
): Promise<CacheResult> {
  const shouldCache = pathname.startsWith("/api/") && payload && Object.keys(payload).length > 0;
  if (!shouldCache) {
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
    console.log("Previous payload:", JSON.stringify(foundRequest.payload));
    console.log("Current payload:", JSON.stringify(payload));

    const payloadsMatch = normalizePayload(foundRequest.payload) === normalizePayload(payload);

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

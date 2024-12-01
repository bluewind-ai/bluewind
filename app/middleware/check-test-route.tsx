// app/middleware/check-test-route.tsx

import { eq } from "drizzle-orm";

import { requests } from "~/db/schema";

import { db } from "./main";

export async function checkIfTestRouteConvertedToHttpProperly(
  pathname: string,
  parentRequestId: string | null,
) {
  if (!parentRequestId) return false;

  const parentRequest = await db
    .select()
    .from(requests)
    .where(eq(requests.id, parseInt(parentRequestId)))
    .limit(1);

  if (parentRequest.length === 0) return false;

  return parentRequest[0].pathname.includes("test-route");
}

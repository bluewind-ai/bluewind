// app/functions/main-flow.get.server.ts

import { desc, eq } from "drizzle-orm";

import { requests } from "~/db/schema";
import { serverFn } from "~/lib/server-functions";
import { db } from "~/middleware/main";

export async function mainFlow(c: any) {
  await serverFn.setupInitialize(c);
  await serverFn.ingestCompanyData(c);
  await serverFn.testRoute(c);
  const bookingResult = await serverFn.evalNewPatientBookingFlow(c);

  const lastBookingRequest = await db
    .select()
    .from(requests)
    .where(eq(requests.parentId, c.requestId))
    .orderBy(desc(requests.createdAt))
    .limit(1)
    .then((rows) => rows[0]);

  if (lastBookingRequest) {
    await serverFn.replay(c, { requestId: lastBookingRequest.id });
  }

  return { bookingResult };
}

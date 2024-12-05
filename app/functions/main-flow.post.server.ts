// app/functions/main-flow.post.server.ts
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { requests } from "~/db/schema";
import { serverFn } from "~/lib/server-functions";
import { db } from "~/middleware/main";

export const mainFlowInputSchema = z.object({});
export const mainFlowOutputSchema = z.object({
  bookingResult: z.object({
    success: z.boolean(),
    requestId: z.number(),
  }),
});
export type MainFlowInput = z.infer<typeof mainFlowInputSchema>;
export type MainFlowOutput = z.infer<typeof mainFlowOutputSchema>;
export async function mainFlow(c: any, input: MainFlowInput): Promise<MainFlowOutput> {
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
  await serverFn.buildFunctionRegistry(c);
  return { bookingResult };
}

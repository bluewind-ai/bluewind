// app/functions/replay.get.server.ts
import { eq } from "drizzle-orm";
import { z } from "zod";

import { requests } from "~/db/schema";
import { serverFn } from "~/lib/server-functions";
import { db } from "~/middleware/main";

export const replayInputSchema = z.object({
  requestId: z.number(),
});
export const replayOutputSchema = z.object({
  result: z.any(),
  replayedRequest: z.any(),
});
export type ReplayInput = z.infer<typeof replayInputSchema>;
export type ReplayOutput = z.infer<typeof replayOutputSchema>;
export async function replay(c: any, input: ReplayInput): Promise<ReplayOutput> {
  const request = await db
    .select()
    .from(requests)
    .where(eq(requests.id, input.requestId))
    .limit(1)
    .then((rows) => rows[0]);
  if (!request) {
    throw new Error(`No request found with ID ${input.requestId}`);
  }
  const result = await serverFn.evalNewPatientBookingFlow(c, request.payload);
  const replayedRequest = await db
    .select()
    .from(requests)
    .where(eq(requests.parentId, c.requestId))
    .limit(1)
    .then((rows) => rows[0]);
  return { result, replayedRequest };
}

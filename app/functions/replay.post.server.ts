// app/functions/replay.post.server.ts
import { eq } from "drizzle-orm";
import { z } from "zod";

import { requests } from "~/db/schema";
import { serverFn } from "~/lib/server-functions";
import { db } from "~/middleware/main";

export const replayInputSchema = z.object({
  requestId: z.number(),
});
export const replayOutputSchema = z.object({
  success: z.boolean(),
  requestId: z.number(),
});
export type ReplayInput = z.infer<typeof replayInputSchema>;
export type ReplayOutput = z.infer<typeof replayOutputSchema>;
export async function replay(c: any, input: ReplayInput): Promise<ReplayOutput> {
  const originalRequest = await db
    .select()
    .from(requests)
    .where(eq(requests.id, input.requestId))
    .then((rows) => rows[0]);
  if (!originalRequest) {
    throw new Error("Original request not found");
  }
  const pathFunctionName = originalRequest.pathname
    .replace("/api/", "")
    .replace(/-/g, "")
    .toLowerCase();
  const functionName = Object.keys(serverFn).find((key) => key.toLowerCase() === pathFunctionName);
  let validatedPayload = originalRequest.payload;
  if (serverFn.schemas[pathFunctionName]) {
    try {
      validatedPayload = serverFn.schemas[pathFunctionName].parse(originalRequest.payload);
    } catch (error) {
      throw new Error("Invalid request payload");
    }
  }
  if (functionName && serverFn[functionName]) {
    const result = await serverFn[functionName](c, validatedPayload);
    if (serverFn.outputSchemas[pathFunctionName]) {
      try {
        serverFn.outputSchemas[pathFunctionName].parse(result);
      } catch (error) {
        throw new Error("Invalid response payload");
      }
    }
    return { success: true, requestId: c.requestId };
  } else {
    throw new Error(`Function not found: ${pathFunctionName}`);
  }
}

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
  console.log("[Replay] Starting replay for request:", input.requestId);

  const originalRequest = await db
    .select()
    .from(requests)
    .where(eq(requests.id, input.requestId))
    .then((rows) => rows[0]);

  console.log("[Replay] Original request:", {
    id: originalRequest?.id,
    parentId: originalRequest?.parentId,
    payload: originalRequest?.payload,
    pathname: originalRequest?.pathname,
  });

  if (!originalRequest) {
    console.error("[Replay] No request found with ID:", input.requestId);
    throw new Error("Original request not found");
  }

  const pathFunctionName = originalRequest.pathname
    .replace("/api/", "")
    .replace(/-/g, "")
    .toLowerCase();

  const functionName = Object.keys(serverFn).find((key) => key.toLowerCase() === pathFunctionName);

  console.log("[Replay] Looking up function:", {
    pathFunctionName,
    functionName,
    availableFunctions: Object.keys(serverFn),
  });

  let validatedPayload = originalRequest.payload;
  if (serverFn.schemas[pathFunctionName]) {
    try {
      validatedPayload = serverFn.schemas[pathFunctionName].parse(originalRequest.payload);
      console.log("[Replay] Input validation successful");
    } catch (error) {
      console.error("[Replay] Input validation failed:", error);
      throw new Error("Invalid request payload");
    }
  }

  if (functionName && serverFn[functionName]) {
    const result = await serverFn[functionName](c, validatedPayload);

    if (serverFn.outputSchemas[pathFunctionName]) {
      try {
        serverFn.outputSchemas[pathFunctionName].parse(result);
        console.log("[Replay] Output validation successful");
      } catch (error) {
        console.error("[Replay] Output validation failed:", error);
        throw new Error("Invalid response payload");
      }
    }

    console.log("[Replay] Function execution result:", result);

    return { success: true, requestId: c.requestId };
  } else {
    console.error("[Replay] Function not found:", { pathFunctionName, functionName });
    throw new Error(`Function not found: ${pathFunctionName}`);
  }
}

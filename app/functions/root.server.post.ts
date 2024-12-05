
// app/functions/root.server.post.ts

import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { routes } from "~/db/schema/routes/schema";
import { getCurrentLocation } from "~/lib/location-tracker";
import { serverFn } from "~/lib/server-functions";
import { db } from "~/middleware/main";

export const rootInputSchema = z.object({});
export const rootOutputSchema = z.object({
  success: z.boolean(),
  requestId: z.number(),
});
export type RootInput = z.infer<typeof rootInputSchema>;
export type RootOutput = z.infer<typeof rootOutputSchema>;
function generateHash(route: string): string {
  return createHash("sha256").update(route).digest("hex");
}
export async function root(c: any, input: RootInput): Promise<RootOutput> {
  const existingRoute = await db.select().from(routes).where(eq(routes.name, "root")).limit(1);
  if (existingRoute.length === 0) {
    await db.insert(routes).values({
      name: "root",
      type: "SYSTEM",
      hash: generateHash("root"),
      requestId: c.requestId,
      metadata: {
        label: "Root",
        variant: "default",
      },
      createdLocation: getCurrentLocation(),
    });
  }
  await serverFn.mainFlow(c);
  return { success: true, requestId: c.requestId };
}

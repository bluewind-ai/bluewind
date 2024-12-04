// app/functions/root.server.ts
import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";

import { routes } from "~/db/schema/routes/schema";
import { getCurrentLocation } from "~/lib/location-tracker";
import { serverFn } from "~/lib/server-functions";
import { db } from "~/middleware/main";

function generateHash(route: string): string {
  return createHash("sha256").update(route).digest("hex");
}
export async function root(c: any) {
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

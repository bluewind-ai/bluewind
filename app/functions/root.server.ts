// app/functions/root.server.ts

import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";

import { serverFunctions } from "~/db/schema";
import { routes } from "~/db/schema/routes/schema";
import { getCurrentLocation } from "~/lib/location-tracker";
import { serverFn } from "~/lib/server-functions";
import { db } from "~/middleware/main";

function generateHash(route: string): string {
  return createHash("sha256").update(route).digest("hex");
}

export async function root(c: any) {
  const existingServerFunction = await db
    .select()
    .from(serverFunctions)
    .where(eq(serverFunctions.name, "root"))
    .limit(1);

  if (existingServerFunction.length === 0) {
    await db.insert(serverFunctions).values({
      name: "root",
      type: "SYSTEM",
      hash: generateHash("root"),
      requestId: c.requestId,
      metadata: {
        label: "Root",
        variant: "default",
        description: "Root server function",
      },
      createdLocation: getCurrentLocation(),
    });
  }

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

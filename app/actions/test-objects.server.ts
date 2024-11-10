// app/actions/test-objects.server.ts

import { db } from "~/db";
import { apps, objects } from "~/db/schema";
import { strict as assert } from "assert";
import { eq } from "drizzle-orm";

export async function testObjects() {
  console.log("=== Starting test objects ===");

  const timestamp = Date.now();
  console.log("Using timestamp:", timestamp);

  // Insert a test app with unique value
  const [insertedApp] = await db
    .insert(apps)
    .values({
      value: `test-app-${timestamp}`,
      label: `Test App ${timestamp}`,
      iconKey: "test",
      order: 999,
    })
    .returning();

  console.log("Inserted app:", insertedApp);

  // Give a tiny delay to ensure insert completed
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Verify an object was created
  const result = await db.query.objects.findFirst({
    where: (fields, { and, eq }) =>
      and(eq(fields.model, "apps"), eq(fields.recordId, insertedApp.id)),
  });

  console.log("Found object:", result);
  console.log("Query params:", {
    model: "apps",
    recordId: insertedApp.id,
  });

  // List all objects to see what's there
  const allObjects = await db.query.objects.findMany();
  console.log("All objects in DB:", allObjects);

  // Assert object exists and matches
  if (!result) {
    throw new Error("Object should have been created");
  }

  assert(result.model === "apps", "Object model should be 'apps'");
  assert(result.recordId === insertedApp.id, "Object recordId should match app id");

  console.log("✅ Test passed!");

  // Cleanup
  await db.delete(apps).where(eq(apps.id, insertedApp.id));
  await db.delete(objects).where(eq(objects.id, result.id));

  return {
    success: true,
    message: "Objects test completed successfully",
    details: {
      insertedApp,
      createdObject: result,
    },
  };
}

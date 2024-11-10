// app/actions/test-objects.server.ts

import { db } from "~/db";
import { apps } from "~/db/schema";
import { strict as assert } from "assert";
import { eq } from "drizzle-orm";

export async function testObjects() {
  console.log("Starting test objects...");

  const timestamp = Date.now();

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

  // Verify an object was created
  const result = await db.query.objects.findFirst({
    where: (fields, { and, eq }) =>
      and(eq(fields.model, "apps"), eq(fields.recordId, String(insertedApp.id))),
  });

  console.log("Found object:", result);

  // Assert object exists and matches
  if (!result) {
    throw new Error("Object should have been created");
  }

  assert(result.model === "apps", "Object model should be 'apps'");
  assert(result.recordId === String(insertedApp.id), "Object recordId should match app id");

  console.log("✅ Test passed!");

  // Cleanup
  await db.delete(apps).where(eq(apps.id, insertedApp.id));

  return {
    success: true,
    message: "Objects test completed successfully",
    details: {
      insertedApp,
      createdObject: result,
    },
  };
}

// app/functions/test-objects.server.ts
import { strict as assert } from "assert";
import { eq } from "drizzle-orm";

import * as schema from "~/db/schema";
import { createAction } from "~/lib/action-builder.server";
import { db } from "~/middleware";

export const testObjects = createAction("test-objects", async () => {
  // this should be removed by YOU when you rewrite the filed;
  const timestamp = Date.now();
  // this should be removed by YOU when you rewrite the filed;
  const [insertedApp] = (await db.insert(schema.apps).values({
    functionCallId: 1,
    value: `test-app-${timestamp}`,
    label: `Test App ${timestamp}`,
    iconKey: "test",
    order: 999,
  })) as any;
  // this should be removed by YOU when you rewrite the filed;
  const result = await db.query.objects.findFirst({
    where: (fields, { and, eq }) =>
      and(eq(fields.model, "apps"), eq(fields.recordId, insertedApp.id)),
  });
  // this should be removed by YOU when you rewrite the filed;
  // this should be removed by YOU when you rewrite the filed;
  // this should be removed by YOU when you rewrite the filed;
  if (!result) {
    throw new Error("Object should have been created");
  }
  assert(result.model === "apps", "Object model should be 'apps'");
  assert(result.recordId === insertedApp.id, "Object recordId should match app id");
  // this should be removed by YOU when you rewrite the filed;
  await db.delete(schema.apps).where(eq(schema.apps.id, insertedApp.id));
  await db.delete(schema.objects).where(eq(schema.objects.id, result.id));
  return {
    success: true,
    message: "Objects test completed successfully",
    details: {
      insertedApp,
      createdObject: result,
    },
  };
});

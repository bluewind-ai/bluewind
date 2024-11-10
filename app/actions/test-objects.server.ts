// app/actions/test-objects.server.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "~/db/schema";
import { strict as assert } from "assert";
import { eq } from "drizzle-orm";

// Create a one-time test client with proxy
const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const client = postgres(connectionString);
const testDb = new Proxy(drizzle(client, { schema }), {
  get(target: PostgresJsDatabase<typeof schema>, prop: string | symbol) {
    console.log("PROXY GET:", String(prop));
    const original = target[prop as keyof typeof target];

    if (prop === "insert") {
      console.log("PROXY INSERT INTERCEPTED!");
      return new Proxy(original as object, {
        get(insertTarget: object, insertProp: string | symbol) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const insertOriginal = (insertTarget as any)[insertProp];

          if (insertProp === "values") {
            return async function (...args: unknown[]) {
              console.log("PROXY VALUES CALLED:", args);

              // Do the original insert
              const result = await insertOriginal.apply(insertTarget, args);
              console.log("PROXY INSERT RESULT:", result);

              // Get the table name and inserted id from the result
              const [table] = args;
              const [inserted] = result;

              console.log("PROXY CREATING OBJECT:", {
                model: table,
                recordId: inserted.id,
              });

              // Track in objects table
              await target.insert(schema.objects).values({
                model: table as string,
                recordId: inserted.id,
              });

              return result;
            };
          }
          return insertOriginal;
        },
      });
    }
    return original;
  },
});

export async function testObjects() {
  console.log("=== Starting test objects ===");

  const timestamp = Date.now();
  console.log("Using timestamp:", timestamp);

  // Insert a test app with unique value
  const [insertedApp] = await testDb
    .insert(schema.apps)
    .values({
      value: `test-app-${timestamp}`,
      label: `Test App ${timestamp}`,
      iconKey: "test",
      order: 999,
    })
    .returning();

  console.log("Inserted app:", insertedApp);

  // Verify an object was created
  const result = await testDb.query.objects.findFirst({
    where: (fields, { and, eq }) =>
      and(eq(fields.model, "apps"), eq(fields.recordId, insertedApp.id)),
  });

  console.log("Found object:", result);
  console.log("Query params:", {
    model: "apps",
    recordId: insertedApp.id,
  });

  // List all objects to see what's there
  const allObjects = await testDb.query.objects.findMany();
  console.log("All objects in DB:", allObjects);

  // Assert object exists and matches
  if (!result) {
    throw new Error("Object should have been created");
  }

  assert(result.model === "apps", "Object model should be 'apps'");
  assert(result.recordId === insertedApp.id, "Object recordId should match app id");

  console.log("✅ Test passed!");

  // Cleanup
  await testDb.delete(schema.apps).where(eq(schema.apps.id, insertedApp.id));
  await testDb.delete(schema.objects).where(eq(schema.objects.id, result.id));

  return {
    success: true,
    message: "Objects test completed successfully",
    details: {
      insertedApp,
      createdObject: result,
    },
  };
}

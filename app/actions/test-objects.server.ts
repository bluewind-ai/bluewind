// app/actions/test-objects.server.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { PgTable } from "drizzle-orm/pg-core";
import * as schema from "~/db/schema";
import { strict as assert } from "assert";
import { eq } from "drizzle-orm";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const client = postgres(connectionString);
const baseDb = drizzle(client, { schema });

function createProxy() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentInsertTable: PgTable<any> = null;

  return new Proxy(baseDb, {
    get(target, prop) {
      console.log("ROOT GET:", prop);

      if (prop === "insert") {
        return (table: PgTable<any>) => {
          console.log("INSERT CALLED WITH:", table);
          currentInsertTable = table;
          return {
            values: async (data: Record<string, unknown>) => {
              console.log("VALUES CALLED WITH:", { table: currentInsertTable, data });

              // Do the original insert
              const result = await target.insert(currentInsertTable).values(data).returning();
              console.log("INSERT RESULT:", result);

              const [inserted] = result;

              // Create the object
              console.log("CREATING OBJECT:", {
                model: currentInsertTable._.name,
                recordId: inserted.id,
              });

              const objectResult = await target
                .insert(schema.objects)
                .values({
                  model: currentInsertTable._.name,
                  recordId: inserted.id,
                })
                .returning();

              console.log("OBJECT CREATED:", objectResult);

              return result;
            },
          };
        };
      }

      return target[prop as keyof typeof target];
    },
  });
}

const testDb = createProxy();

export async function testObjects() {
  console.log("=== Starting test objects ===");

  const timestamp = Date.now();
  console.log("Using timestamp:", timestamp);

  // Insert a test app with unique value
  const [insertedApp] = await testDb.insert(schema.apps).values({
    value: `test-app-${timestamp}`,
    label: `Test App ${timestamp}`,
    iconKey: "test",
    order: 999,
  });

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

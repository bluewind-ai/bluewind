// app/actions/test-objects.server.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { PgTable, TableConfig } from "drizzle-orm/pg-core";
import * as schema from "~/db/schema";
import { strict as assert } from "assert";
import { eq } from "drizzle-orm";

type AppSelect = typeof schema.apps.$inferSelect;

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const client = postgres(connectionString);
const baseDb = drizzle(client, { schema });

function createProxy() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentInsertTable: PgTable<TableConfig> | null = null;

  return new Proxy(baseDb, {
    get(target, prop) {
      console.log("ROOT GET:", prop);

      if (prop === "insert") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (table: PgTable<TableConfig>) => {
          console.log("INSERT CALLED WITH:", table);
          currentInsertTable = table;
          return {
            values: async (data: Record<string, unknown>) => {
              console.log("VALUES CALLED WITH:", { table: currentInsertTable, data });

              if (!currentInsertTable) {
                throw new Error("No table specified for insert");
              }

              // Do the original insert
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const result = await target
                .insert(currentInsertTable)
                .values(data as Record<string, unknown>)
                .returning();
              console.log("INSERT RESULT:", result);

              const [inserted] = result;

              // Create the object
              console.log("CREATING OBJECT:", {
                model: currentInsertTable._.name,
                recordId: inserted.id,
              });

              await target
                .insert(schema.objects)
                .values({
                  model: currentInsertTable._.name,
                  recordId: Number(inserted.id),
                })
                .returning();

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
  const [insertedApp] = (await testDb.insert(schema.apps).values({
    value: `test-app-${timestamp}`,
    label: `Test App ${timestamp}`,
    iconKey: "test",
    order: 999,
  })) as [AppSelect];

  console.log("Inserted app:", insertedApp);

  // Verify an object was created
  const result = await baseDb.query.objects.findFirst({
    where: (fields, { and, eq }) =>
      and(eq(fields.model, "apps"), eq(fields.recordId, insertedApp.id)),
  });

  console.log("Found object:", result);
  console.log("Query params:", {
    model: "apps",
    recordId: insertedApp.id,
  });

  // List all objects to see what's there
  const allObjects = await baseDb.query.objects.findMany();
  console.log("All objects in DB:", allObjects);

  // Assert object exists and matches
  if (!result) {
    throw new Error("Object should have been created");
  }

  assert(result.model === "apps", "Object model should be 'apps'");
  assert(result.recordId === insertedApp.id, "Object recordId should match app id");

  console.log("✅ Test passed!");

  // Cleanup
  await baseDb.delete(schema.apps).where(eq(schema.apps.id, insertedApp.id));
  await baseDb.delete(schema.objects).where(eq(schema.objects.id, result.id));

  return {
    success: true,
    message: "Objects test completed successfully",
    details: {
      insertedApp,
      createdObject: result,
    },
  };
}

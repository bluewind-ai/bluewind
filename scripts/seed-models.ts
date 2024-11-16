// scripts/seed-models.ts

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { models, objects, requests } from "~/db/schema";
import { TABLES } from "~/db/schema/table-models";

const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;

const connectionString = `postgres://${DB_USERNAME}${DB_PASSWORD ? ":" + DB_PASSWORD : ""}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
console.log("Connecting to database:", connectionString.replace(/:.*@/, ":***@")); // Hide password in logs

const client = postgres(connectionString);
const db = drizzle(client);

async function runTransaction() {
  console.log("Starting to seed models...");

  await db.transaction(
    async (trx) => {
      console.log("Starting transaction...");

      // Delete all existing records first
      await trx.execute(sql`TRUNCATE TABLE ${models} RESTART IDENTITY CASCADE`);
      console.log("Cleared existing models");

      // Create a request first
      const [request] = await trx.insert(requests).values({}).returning();
      console.log("Created request:", request);

      // Create all models in order so we know their IDs
      const modelEntries = Object.entries(TABLES);
      const modelData = modelEntries.map(([_key, config]) => ({
        requestId: request.id,
        pluralName: config.modelName,
        singularName: config.modelName.endsWith("s")
          ? config.modelName.slice(0, -1)
          : config.modelName,
      }));

      // Insert new records
      const insertedModels = await trx.insert(models).values(modelData).returning();
      console.log("Successfully seeded models:", JSON.stringify(insertedModels, null, 2));

      // Get the model IDs - they'll be in the same order as TABLES entries
      const requestsModelId =
        insertedModels[Object.keys(TABLES).indexOf(TABLES.requests.urlName)].id;
      const modelsModelId = insertedModels[Object.keys(TABLES).indexOf(TABLES.models.urlName)].id;

      console.log("\nCreating objects for models and request...");
      const objectsToInsert = [
        // Object for the request itself
        {
          modelId: requestsModelId,
          recordId: request.id,
        },
        // Objects for the models themselves
        ...insertedModels.map((model) => ({
          modelId: modelsModelId,
          recordId: model.id,
        })),
      ];

      console.log("Objects to insert:", JSON.stringify(objectsToInsert, null, 2));

      const insertedObjects = await trx.insert(objects).values(objectsToInsert).returning();
      console.log("\nSuccessfully created objects:", JSON.stringify(insertedObjects, null, 2));

      // Log final state
      const finalObjects = await trx.select().from(objects);
      console.log("\nFinal objects in database:", JSON.stringify(finalObjects, null, 2));

      console.log("Transaction completed successfully");
    },
    {
      isolationLevel: "serializable",
    },
  );
}

async function seedModels() {
  let retries = 3;

  while (retries > 0) {
    try {
      await runTransaction();
      break;
    } catch (error: any) {
      if (error?.code === "40001" && retries > 1) {
        console.log(`Serialization failure, retrying... (${retries - 1} attempts left)`);
        retries--;
        continue;
      }
      throw error;
    }
  }
}

seedModels()
  .catch((error) => {
    console.error("Failed to seed models:", error);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });

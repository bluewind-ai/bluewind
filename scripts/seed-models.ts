// scripts/seed-models.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { models, objects, requests, schema } from "~/db/schema";
import { TABLES } from "~/db/schema/table-models";

const MODEL_NAMES = Object.keys(TABLES) as (keyof typeof TABLES)[];

function generateModelsToInsert() {
  return MODEL_NAMES.map((name, index) => ({
    id: index + 1,
    pluralName: TABLES[name].modelName,
    singularName: TABLES[name].modelName.slice(0, -1),
  }));
}

async function main() {
  const DB_HOST = process.env.DB_HOST!;
  const DB_PORT = process.env.DB_PORT!;
  const DB_NAME = process.env.DB_NAME!;
  const DB_USERNAME = process.env.DB_USERNAME!;
  const DB_PASSWORD = process.env.DB_PASSWORD!;

  const connectionString = `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

  const sql = postgres(connectionString);
  const db = drizzle(sql, schema);

  console.log("Starting models seeder...");

  const modelsToInsert = generateModelsToInsert();
  console.log("Inserting models:", modelsToInsert);
  const insertedModels = await db.insert(models).values(modelsToInsert).returning();
  console.log("Inserted models:", insertedModels);

  // Create one request
  console.log("Creating request...");
  const insertedRequest = await db.insert(requests).values({ id: 1 }).returning();
  console.log("Inserted request:", insertedRequest);

  // Create objects for models AND request
  console.log("Creating objects...");
  const objectsToInsert = [
    // Objects for models
    ...insertedModels.map((model) => ({
      modelId: model.id,
      recordId: model.id,
      requestId: 1,
    })),
    // Object for the request itself
    {
      modelId: 6, // ID of the 'requests' model
      recordId: 1, // ID of the request we just created
      requestId: 1,
    },
  ];

  const insertedObjects = await db.insert(objects).values(objectsToInsert).returning();
  console.log("Inserted objects:", insertedObjects);

  console.log("Models seeding completed successfully");
  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

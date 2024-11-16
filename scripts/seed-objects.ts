// scripts/seed-objects.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { models, objects } from "~/db/schema";

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || "5432";
const DB_NAME = process.env.DB_NAME || "bluewind";
const DB_USERNAME = process.env.DB_USERNAME || "merwanehamadi";
const DB_PASSWORD = process.env.DB_PASSWORD;

const connectionString = `postgres://${DB_USERNAME}${DB_PASSWORD ? ":" + DB_PASSWORD : ""}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
console.log("Connecting to database:", connectionString.replace(/:.*@/, ":***@")); // Hide password in logs

const client = postgres(connectionString);
const db = drizzle(client);

async function seedObjects() {
  console.log("Starting to seed objects...");

  try {
    // First get all the models to create their objects
    const allModels = await db.select().from(models);
    console.log("Found models:", allModels);

    // For each model, create an object entry
    const objectsToInsert = allModels.map((model) => ({
      modelId: model.id,
      recordId: model.id,
      functionCallId: null,
    }));

    // Delete existing objects
    await db.delete(objects);
    console.log("Cleared existing objects");

    // Insert new objects
    await db.insert(objects).values(objectsToInsert);
    console.log("Successfully created objects for models");

    // Verify the seeding
    const seededObjects = await db.select().from(objects);
    console.log(JSON.stringify(seededObjects, null, 2));
  } catch (error) {
    console.error("Error seeding objects:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seedObjects().catch((error) => {
  console.error("Failed to seed objects:", error);
  process.exit(1);
});

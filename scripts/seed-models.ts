// scripts/seed-models.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { models, schema } from "~/db/schema";
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

  try {
    console.log("Starting models seeder...");

    const modelsToInsert = generateModelsToInsert();
    console.log("Inserting models:", modelsToInsert);
    const insertedModels = await db.insert(models).values(modelsToInsert).returning();
    console.log("Inserted models:", insertedModels);

    console.log("Models seeding completed successfully");
  } catch (error) {
    console.error("Error seeding models:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

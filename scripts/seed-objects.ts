// scripts/seed-objects.ts

import postgres from "postgres";

import { objects } from "~/db/schema";
import { db } from "~/middleware/main";

function getRandomObjectsToInsert() {
  return Array.from({ length: 10 }).map((_, index) => ({
    modelId: 1,
    recordId: index + 1,
    functionCallId: null,
    requestId: 1, // Add this field with a default request ID of 1
  }));
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    const objectsToInsert = getRandomObjectsToInsert();
    console.log("Inserting objects:", objectsToInsert);
    await db.insert(objects).values(objectsToInsert);
    console.log("Objects inserted successfully");
  } catch (error) {
    console.error("Error seeding objects:", error);
  } finally {
    await sql.end();
  }
}

await main();

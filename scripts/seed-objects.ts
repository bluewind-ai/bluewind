// scripts/seed-objects.ts

import postgres from "postgres";

import { objects } from "~/db/schema";
import { db } from "~/middleware/main";

function getRandomObjectsToInsert() {
  return [
    {
      modelId: 1,
      recordId: 1,
      functionCallId: null,
      requestId: 1, // We'll use requestId 1 for now since null isn't allowed in the type
    },
  ];
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    const objectsToInsert = getRandomObjectsToInsert();
    console.log("Inserting root object:", objectsToInsert);
    await db.insert(objects).values(objectsToInsert);
    console.log("Root object inserted successfully");
  } catch (error) {
    console.error("Error seeding objects:", error);
  } finally {
    await sql.end();
  }
}

await main();

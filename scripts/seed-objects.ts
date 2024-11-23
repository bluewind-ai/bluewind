// scripts/seed-objects.ts

import postgres from "postgres";

import { functionCalls, objects } from "~/db/schema";
import { FunctionCallStatus } from "~/db/schema/function-calls/schema";
import { db } from "~/middleware/main";

async function getRandomObjectsToInsert() {
  // First create a function call
  const [functionCall] = await db
    .insert(functionCalls)
    .values({
      serverFunctionId: 1, // Make sure this exists
      requestId: 1,
      status: FunctionCallStatus.COMPLETED,
      args: null,
      result: null,
    })
    .returning();

  return [
    {
      modelId: 1,
      recordId: 1,
      functionCallId: functionCall.id,
      requestId: 1,
    },
  ];
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    const objectsToInsert = await getRandomObjectsToInsert();
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

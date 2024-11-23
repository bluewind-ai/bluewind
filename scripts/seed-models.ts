// scripts/seed-models.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { functionCalls, schema } from "~/db/schema";
import { FunctionCallStatus } from "~/db/schema/function-calls/schema";
import { CreateModel, models, ModelSchema } from "~/db/schema/models/schema";
import { objects, ObjectSchema } from "~/db/schema/objects/schema";
import { CreateRequest, requests, RequestSchema } from "~/db/schema/requests/schema";
import { serverFunctions, ServerFunctionType } from "~/db/schema/server-functions/schema";
import { TABLES } from "~/db/schema/table-models";
import type { ButtonVariant } from "~/lib/server-functions-types";

const MODEL_NAMES = Object.keys(TABLES) as (keyof typeof TABLES)[];

function generateModelsToInsert(): CreateModel[] {
  return MODEL_NAMES.map((name, index) =>
    ModelSchema.parse({
      id: index + 1,
      pluralName: TABLES[name].modelName,
      singularName: TABLES[name].modelName.slice(0, -1),
    }),
  );
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
  const requestToInsert: CreateRequest = RequestSchema.parse({ id: 1 });
  const insertedRequest = await db.insert(requests).values(requestToInsert).returning();
  console.log("Inserted request:", insertedRequest);

  // Insert just the bootstrap function
  console.log("Creating bootstrap function...");
  const [bootstrapFunction] = await db
    .insert(serverFunctions)
    .values({
      name: "bootstrap",
      type: ServerFunctionType.SYSTEM,
      requestId: insertedRequest[0].id,
      metadata: {
        label: "Bootstrap",
        variant: "default" as ButtonVariant,
      },
    })
    .returning();
  console.log("Inserted bootstrap function:", bootstrapFunction);

  // Create a function call
  const [functionCall] = await db
    .insert(functionCalls)
    .values({
      serverFunctionId: bootstrapFunction.id,
      requestId: insertedRequest[0].id,
      status: FunctionCallStatus.COMPLETED,
      args: null,
      result: null,
    })
    .returning();

  // Create objects for models AND request
  console.log("Creating objects...");
  const objectsToInsert = [
    // Objects for the model records in the models table
    ...insertedModels.map((model) =>
      ObjectSchema.parse({
        modelId: 7, // models model ID
        recordId: model.id,
        requestId: insertedRequest[0].id,
        functionCallId: functionCall.id,
      }),
    ),
    // Object for the request itself
    ObjectSchema.parse({
      modelId: 6, // requests model ID
      recordId: insertedRequest[0].id,
      requestId: insertedRequest[0].id,
      functionCallId: functionCall.id,
    }),
    // Object for bootstrap function
    ObjectSchema.parse({
      modelId: 3, // server_functions model ID
      recordId: bootstrapFunction.id,
      requestId: insertedRequest[0].id,
      functionCallId: functionCall.id,
    }),
    // Object for function call
    ObjectSchema.parse({
      modelId: 4, // function_calls model ID
      recordId: functionCall.id,
      requestId: insertedRequest[0].id,
      functionCallId: functionCall.id,
    }),
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

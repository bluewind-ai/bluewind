// scripts/seed-models.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { schema } from "~/db/schema";
import { CreateModel, models, ModelSchema } from "~/db/schema/models/schema";
import { objects, ObjectSchema } from "~/db/schema/objects/schema";
import { CreateRequest, requests, RequestSchema } from "~/db/schema/requests/schema";
import { serverFunctions, ServerFunctionType } from "~/db/schema/server-functions/schema";
import { TABLES } from "~/db/schema/table-models";
import type { ButtonVariant } from "~/lib/server-functions-types";

const MODEL_NAMES = Object.keys(TABLES) as (keyof typeof TABLES)[];

const CORE_SERVER_FUNCTIONS = [
  {
    name: "truncateDb",
    label: "Truncate DB",
    variant: "destructive" as ButtonVariant,
    type: ServerFunctionType.SYSTEM,
  },
  {
    name: "bootstrap",
    label: "Bootstrap",
    variant: "default" as ButtonVariant,
    type: ServerFunctionType.SYSTEM,
  },
  {
    name: "updateFiles",
    label: "Update Files",
    variant: "default" as ButtonVariant,
    type: ServerFunctionType.SYSTEM,
  },
  {
    name: "generateRoutes",
    label: "Generate Routes",
    variant: "default" as ButtonVariant,
    type: ServerFunctionType.SYSTEM,
  },
  {
    name: "loadNavigationData",
    label: "Load Navigation Data",
    variant: "default" as ButtonVariant,
    type: ServerFunctionType.SYSTEM,
  },
] as const;

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

  // Create objects for models AND request
  console.log("Creating objects...");
  const objectsToInsert = [
    // Objects for models
    ...insertedModels.map((model) =>
      ObjectSchema.parse({
        modelId: model.id,
        recordId: model.id,
        requestId: 1,
      }),
    ),
    // Object for the request itself
    ObjectSchema.parse({
      modelId: 6,
      recordId: 1,
      requestId: 1,
    }),
  ];

  const insertedObjects = await db.insert(objects).values(objectsToInsert).returning();
  console.log("Inserted objects:", insertedObjects);

  // Insert server functions
  console.log("Creating server functions...");
  const serverFunctionsToInsert = CORE_SERVER_FUNCTIONS.map((fn) => ({
    name: fn.name,
    type: fn.type,
    requestId: 1,
    metadata: {
      label: fn.label,
      variant: fn.variant,
    },
  }));

  const insertedServerFunctions = await db
    .insert(serverFunctions)
    .values(serverFunctionsToInsert)
    .returning();
  console.log("Inserted server functions:", insertedServerFunctions);

  // Create objects for server functions
  console.log("Creating objects for server functions...");
  const serverFunctionObjects = insertedServerFunctions.map((fn) =>
    ObjectSchema.parse({
      modelId: 3, // server_functions model ID
      recordId: fn.id,
      requestId: 1,
    }),
  );

  const insertedServerFunctionObjects = await db
    .insert(objects)
    .values(serverFunctionObjects)
    .returning();
  console.log("Inserted server function objects:", insertedServerFunctionObjects);

  console.log("Models seeding completed successfully");
  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

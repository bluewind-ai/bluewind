
// app/functions/setup-initialize.post.server.ts

import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { objects } from "~/db/schema";
import { models } from "~/db/schema/models/schema";
import { serverFunctions } from "~/db/schema/server-functions/schema";
import { TABLES } from "~/db/schema/table-models";
import { getCurrentLocation } from "~/lib/location-tracker";
import { serverFn } from "~/lib/server-functions";
import { db } from "~/middleware/main";

export const setupInitializeInputSchema = z.object({});
export const setupInitializeOutputSchema = z.object({
  success: z.boolean(),
});
export type SetupInitializeInput = z.infer<typeof setupInitializeInputSchema>;
export type SetupInitializeOutput = z.infer<typeof setupInitializeOutputSchema>;
function generateHash(route: string): string {
  return createHash("sha256").update(route).digest("hex");
}
export async function setupInitialize(
  c: any,
  input: SetupInitializeInput,
): Promise<SetupInitializeOutput> {
  const existingModels = await db.select().from(models);
  const existingModelNames = new Set(existingModels.map((m) => m.pluralName));
  const missingModels = Object.entries(TABLES)
    .filter(([_, config]) => !existingModelNames.has(config.modelName))
    .map(([_, config]) => ({
      pluralName: config.modelName,
      singularName: config.modelName.slice(0, -1),
      requestId: c.requestId,
      createdLocation: getCurrentLocation(),
    }));
  let insertedModels = [];
  if (missingModels.length > 0) {
    insertedModels = await db.insert(models).values(missingModels).returning();
  }
  const allModels = [...existingModels, ...insertedModels];
  const requestModel = allModels.find((m) => m.pluralName === TABLES.requests.modelName);
  const serverFunctionModel = allModels.find(
    (m) => m.pluralName === TABLES.serverFunctions.modelName,
  );
  const modelsModel = allModels.find((m) => m.pluralName === "models");
  if (!requestModel || !serverFunctionModel || !modelsModel) {
    throw new Error("Required models not found");
  }
  const existingRootFunction = await db
    .select()
    .from(serverFunctions)
    .where(eq(serverFunctions.name, "root"))
    .limit(1);
  let rootServerFunction;
  if (existingRootFunction.length === 0) {
    [rootServerFunction] = await db
      .insert(serverFunctions)
      .values({
        name: "root",
        type: "SYSTEM",
        hash: generateHash("root"),
        requestId: c.requestId,
        metadata: {
          variant: "default",
          label: "Root",
          description: "Root server function",
        },
        createdLocation: getCurrentLocation(),
      })
      .returning();
  } else {
    rootServerFunction = existingRootFunction[0];
  }
  const objectsToCreate = [];
  if (existingRootFunction.length === 0) {
    objectsToCreate.push({
      modelId: serverFunctionModel.id,
      recordId: rootServerFunction.id,
      requestId: c.requestId,
      createdLocation: getCurrentLocation(),
    });
  }
  objectsToCreate.push(
    ...insertedModels.map((model) => ({
      modelId: modelsModel.id,
      recordId: model.id,
      requestId: c.requestId,
      createdLocation: getCurrentLocation(),
    })),
  );
  if (objectsToCreate.length > 0) {
    await db.insert(objects).values(objectsToCreate);
  }
  await serverFn.loadRoutes(c);
  return { success: true };
}

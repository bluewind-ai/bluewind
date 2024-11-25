// app/functions/root.server.ts
import { sql } from "drizzle-orm";

import { functionCalls } from "~/db/schema";
import { FunctionCallStatus } from "~/db/schema/function-calls/schema";
import { models } from "~/db/schema/models/schema";
import { requests } from "~/db/schema/requests/schema";
import { serverFunctions, ServerFunctionType } from "~/db/schema/server-functions/schema";
import { TABLES } from "~/db/schema/table-models";
import type { ButtonVariant } from "~/lib/server-functions-types";
import type { ExtendedContext } from "~/middleware";
import { createDbProxy } from "~/middleware";
import { db } from "~/middleware/main";

import { master } from "./master.server";

const MODEL_NAMES = Object.keys(TABLES) as (keyof typeof TABLES)[];
// First create the function call that owns all bootstrapping
const BOOTSTRAP_FUNCTION_CALL_ID = 1;
function generateModelsToInsert() {
  return MODEL_NAMES.map((name, index) => ({
    id: index + 1,
    pluralName: TABLES[name].modelName,
    singularName: TABLES[name].modelName.slice(0, -1),
    functionCallId: BOOTSTRAP_FUNCTION_CALL_ID,
  }));
}
export async function root(c: ExtendedContext) {
  // const queries: DrizzleQuery[] = [];
  const dbWithProxy = createDbProxy(db, c);
  const [insertedRequest] = await dbWithProxy
    .insert(requests)
    .values({
      requestId: 0, // Temporary value
      functionCallId: BOOTSTRAP_FUNCTION_CALL_ID,
    })
    .returning();
  // Update request to point to itself
  await dbWithProxy
    .update(requests)
    .set({ requestId: insertedRequest.id })
    .where(sql`${requests.id} = ${insertedRequest.id}`);
  const [rootFunction] = await dbWithProxy
    .insert(serverFunctions)
    .values({
      id: 1,
      name: "root",
      type: ServerFunctionType.SYSTEM,
      functionCallId: BOOTSTRAP_FUNCTION_CALL_ID,
      requestId: insertedRequest.id,
      metadata: {
        label: "Root",
        variant: "default" as ButtonVariant,
      },
    })
    .returning();
  // Create function call with explicit ID
  await dbWithProxy
    .insert(functionCalls)
    .values({
      id: BOOTSTRAP_FUNCTION_CALL_ID,
      serverFunctionId: rootFunction.id,
      status: FunctionCallStatus.COMPLETED,
      functionCallId: BOOTSTRAP_FUNCTION_CALL_ID,
      requestId: insertedRequest.id,
      args: null,
      result: null,
    })
    .returning();
  // Create models with explicit IDs
  const modelsToInsert = generateModelsToInsert().map((model) => ({
    ...model,
    requestId: insertedRequest.id,
  }));
  await dbWithProxy.insert(models).values(modelsToInsert).returning();
  await master(c);
}

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

function generateModelsToInsert() {
  return MODEL_NAMES.map((name) => ({
    pluralName: TABLES[name].modelName,
    singularName: TABLES[name].modelName.slice(0, -1),
  }));
}

export async function root(c: ExtendedContext) {
  // First create request with raw db (no proxy)
  const [insertedRequest] = await db
    .insert(requests)
    .values({
      requestId: 0,
      functionCallId: 1,
    })
    .returning();

  // Update request to point to itself (still raw db)
  await db
    .update(requests)
    .set({ requestId: insertedRequest.id })
    .where(sql`${requests.id} = ${insertedRequest.id}`);

  // Set the request ID in context so proxy can work
  c.requestId = insertedRequest.id;

  // Now we can use the proxy for the rest
  const dbWithProxy = createDbProxy(db, c);

  await dbWithProxy.transaction(async (trx) => {
    const proxiedTrx = createDbProxy(trx, c);

    // Create server function with all required fields
    const [rootFunction] = await proxiedTrx
      .insert(serverFunctions)
      .values({
        name: "root",
        type: ServerFunctionType.SYSTEM,
        requestId: insertedRequest.id,
        functionCallId: 1,
        metadata: {
          label: "Root",
          variant: "default" as ButtonVariant,
        },
      })
      .returning();

    // Create the actual function call
    const [functionCall] = await proxiedTrx
      .insert(functionCalls)
      .values({
        id: 1, // Match the temporary ID we used
        serverFunctionId: rootFunction.id,
        status: FunctionCallStatus.COMPLETED,
        requestId: insertedRequest.id,
        functionCallId: 1,
        args: null,
        result: null,
      })
      .returning();

    // Create models
    const modelsToInsert = generateModelsToInsert().map((model) => ({
      ...model,
      requestId: insertedRequest.id,
      functionCallId: functionCall.id,
    }));
    await proxiedTrx.insert(models).values(modelsToInsert).returning();

    // Update context with the transaction
    c.db = proxiedTrx;

    // Call master within the same transaction
    await master(c);
  });
}

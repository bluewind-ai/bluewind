// app/functions/bootstrap.server.ts

import * as schema from "~/db/schema";
import { functionCalls, FunctionCallStatus } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

import { truncateDb } from "./truncate-db.server";

export async function bootstrap(request: RequestExtensions) {
  const db = request.db;

  // First truncate everything and reseed models
  await truncateDb(request);

  // Now we can be sure we have a request from the seedModels
  const foundRequest = await db.query.requests.findFirst();
  if (!foundRequest) {
    throw new Error("No request found");
  }

  const [masterAction] = await db
    .insert(schema.serverFunctions)
    .values({
      requestId: foundRequest.id,
      name: "master",
      type: schema.ServerFunctionType.SYSTEM,
    })
    .returning();

  await db
    .insert(functionCalls)
    .values({
      requestId: foundRequest.id,
      serverFunctionId: masterAction.id,
      status: FunctionCallStatus.READY_FOR_APPROVAL,
    })
    .returning();

  await new Promise((resolve) => setTimeout(resolve, 1));
}

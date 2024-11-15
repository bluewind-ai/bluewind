// app/routes/api.bootstrap.ts
import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "~/db/schema";
import { functionCalls } from "~/db/schema";
import { FunctionCallStatus } from "~/db/schema/types";

type DbClient = PostgresJsDatabase<typeof schema>;
async function _action(args: ActionFunctionArgs) {
  const { trx } = args.context;
  const db = trx as DbClient;
  const request = await db.query.requests.findFirst();
  if (!request) {
    throw new Error("No request found");
  }
  // const [masterAction] = await db
  //   .insert(serverFunctions)
  //   .values({
  //     requestId: request.id,
  //     name: "master",
  //     type: ActionType.SYSTEM,
  //   })
  //   .returning();
  await db
    .insert(functionCalls)
    .values({
      requestId: request.id,
      actionId: 202,
      status: FunctionCallStatus.READY_FOR_APPROVAL,
    })
    .returning();

  await new Promise((resolve) => setTimeout(resolve, 1));
  dd(args.context.queries);

  return redirect("/");
}
export async function action(args: ActionFunctionArgs) {
  const response = await _action(args);
  return response;
}

// app/routes/api.truncate-db.ts
import { redirect } from "@remix-run/node";
import { type PgTable } from "drizzle-orm/pg-core";

import {
  debugLogs,
  functionCalls,
  objects,
  requestErrors,
  requests,
  serverFunctions,
  sessions,
  TABLES,
  users,
} from "~/db/schema";
import { RequestExtensions } from "~/middleware";

export async function action({ context: request }: { context: RequestExtensions }) {
  const db = request.db;
  const tableMap: Record<string, PgTable<any>> = {
    functionCalls,
    serverFunctions,
    objects,
    requestErrors,
    debugLogs,
    sessions,
    users,
    requests,
  };
  for (const tableName in TABLES) {
    await db.delete(tableMap[tableName]).returning();
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
  return redirect("/");
}
// export async function action(args: ActionFunctionArgs) {
//   return await _action(args);
// }

// app/functions/truncate-db.server.ts

import { db } from "~/db";
import { functionCalls, objects, serverFunctions } from "~/db/schema";
import { createAction } from "~/lib/action-builder.server";

export const truncateDb = createAction("truncate-db", async () => {
  // Truncate tables in the correct order (respecting foreign keys)
  await db.delete(objects);
  await db.delete(functionCalls);
  await db.delete(serverFunctions);

  return {
    success: true,
    message: "All database tables truncated successfully",
  };
});

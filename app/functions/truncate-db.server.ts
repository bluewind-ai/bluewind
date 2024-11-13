// app/functions/truncate-db.server.ts
import { functionCalls, objects, serverFunctions } from "~/db/schema";
import { createAction } from "~/lib/action-builder.server";
import { db } from "~/middleware";

export const truncateDb = createAction("truncate-db", async () => {
  await db.delete(objects);
  await db.delete(functionCalls);
  await db.delete(serverFunctions);
  return {
    success: true,
    message: "All database tables truncated successfully",
  };
});

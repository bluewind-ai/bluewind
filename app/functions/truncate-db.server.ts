// app/functions/truncate-db.server.ts

import { db } from "~/db";
import { functionCalls, objects, serverFunctions } from "~/db/schema";
import { createAction } from "~/lib/action-builder.server";

export const truncateDb = createAction("truncate-db", async () => {
  const objectsDeleted = await db.delete(objects);
  console.log("Objects deleted:", objectsDeleted);

  const functionCallsDeleted = await db.delete(functionCalls);
  console.log("Function calls deleted:", functionCallsDeleted);

  const serverFunctionsDeleted = await db.delete(serverFunctions);
  console.log("Server functions deleted:", serverFunctionsDeleted);

  return {
    success: true,
    message: "All database tables truncated successfully",
  };
});

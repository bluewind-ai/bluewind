// app/lib/utils/apps/execute-generate-apps.ts

import { db } from "~/db";
import { functionCalls, FunctionCallStatus } from "~/db/schema";

import { generateApps } from "./generate-apps";
import { loadAppsToDB } from "./load-apps-to-db-server";

export async function executeGenerateApps() {
  console.log("🚀 Starting complete apps generation process");

  const generateResult = await generateApps();
  console.log("✓ Apps file generated");

  const loadResult = await loadAppsToDB();
  console.log("✓ Apps loaded to database");

  const thisAction = await db.query.serverFunctions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "execute-generate-apps"),
  });

  if (!thisAction) throw new Error("execute-generate-apps not found in database");

  const [functionCall] = await db
    .insert(functionCalls)
    .values({
      actionId: thisAction.id,
      status: FunctionCallStatus.COMPLETED,
      result: {
        success: true,
        generateResult,
        loadResult,
      },
    })
    .returning();

  console.log("✨ Complete apps generation process finished");
  return functionCall;
}

// app/lib/utils/apps/executeGenerateApps.server.ts

import { db } from "~/db";
import { functionCalls } from "~/db/schema";
import { generateApps } from "./generateApps.server";
import { loadAppsToDB } from "./loadAppsToDB.server";

export async function executeGenerateApps() {
  console.log("🚀 Starting complete apps generation process");

  const generateResult = await generateApps();
  console.log("✓ Apps file generated");

  const loadResult = await loadAppsToDB();
  console.log("✓ Apps loaded to database");

  const thisAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "execute-generate-apps"),
  });

  if (!thisAction) throw new Error("execute-generate-apps not found in database");

  const [functionCall] = await db
    .insert(functionCalls)
    .values({
      actionId: thisAction.id,
      status: "completed",
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

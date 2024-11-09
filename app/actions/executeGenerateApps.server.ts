// app/actions/executeGenerateApps.server.ts

import { db } from "~/db";
import { actionCalls } from "~/db/schema";

export async function executeGenerateApps() {
  console.log("🚀 Starting complete apps generation process");

  const generateResult = await generateApps();
  console.log("✓ Apps file generated");

  const loadResult = await loadAppsToDB();
  console.log("✓ Apps loaded to database");

  // Create an action call record for the full process
  const thisAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "execute-generate-apps"),
  });

  if (!thisAction) throw new Error("execute-generate-apps not found in database");

  const [actionCall] = await db
    .insert(actionCalls)
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
  return actionCall;
}

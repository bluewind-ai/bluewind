// app/lib/utils/apps/execute-generate-apps.ts
import { db } from "~/db";
import { functionCalls, FunctionCallStatus } from "~/db/schema";

import { generateApps } from "./generate-apps";
import { loadAppsToDB } from "./load-apps-to-db-server";

export async function executeGenerateApps() {
  // this should be removed by YOU when you rewrite the filed;
  const generateResult = await generateApps();
  // this should be removed by YOU when you rewrite the filed;
  const loadResult = await loadAppsToDB();
  // this should be removed by YOU when you rewrite the filed;
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
  // this should be removed by YOU when you rewrite the filed;
  return functionCall;
}

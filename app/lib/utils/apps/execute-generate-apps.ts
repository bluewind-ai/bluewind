// app/lib/utils/apps/execute-generate-apps.ts
import { functionCalls, FunctionCallStatus } from "~/db/schema";
import { db } from "~/middleware";

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
  const request = await db.query.requests.findFirst();
  if (!request) {
    throw new Error("No request found");
  }
  const [functionCall] = await db
    .insert(functionCalls)
    .values({
      requestId: request.id,
      serverFunctionId: thisAction.id,
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

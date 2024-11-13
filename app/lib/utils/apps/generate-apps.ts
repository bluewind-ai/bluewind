// app/lib/utils/apps/generate-apps.ts
import fs from "fs";
import path from "path";

import { db } from "~/db";
import { functionCalls, FunctionCallStatus } from "~/db/schema";

export async function generateApps() {
  // this should be removed by YOU when you rewrite the filed;
  const appsData = await db.query.apps.findMany({
    orderBy: (apps, { asc }) => [asc(apps.order)],
  });
  const fileContent = `
// THIS FILE IS AUTO-GENERATED - DO NOT EDIT
export const apps = ${JSON.stringify(appsData, null, 2)} as const;
`;
  const generatedDir = path.join(process.cwd(), "app", "lib", "generated");
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }
  fs.writeFileSync(path.join(generatedDir, "apps.ts"), fileContent, "utf-8");
  const thisAction = await db.query.serverFunctions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "generate-apps"),
  });
  if (!thisAction) throw new Error("generate-apps not found in database");
  const [functionCall] = await db
    .insert(functionCalls)
    .values({
      actionId: thisAction.id,
      status: FunctionCallStatus.COMPLETED,
      result: {
        success: true,
        appsCount: appsData.length,
      },
    })
    .returning();
  // this should be removed by YOU when you rewrite the filed;
  return functionCall;
}

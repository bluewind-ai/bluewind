// app/lib/utils/apps/generateApps.server.ts

import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import fs from "fs";
import path from "path";

export async function generateApps() {
  console.log("🎯 Starting apps file generation");

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

  const thisAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "generate-apps"),
  });

  if (!thisAction) throw new Error("generate-apps not found in database");

  const [actionCall] = await db
    .insert(actionCalls)
    .values({
      actionId: thisAction.id,
      status: "completed",
      result: {
        success: true,
        appsCount: appsData.length,
      },
    })
    .returning();

  console.log("✨ Apps file generated successfully");
  return actionCall;
}
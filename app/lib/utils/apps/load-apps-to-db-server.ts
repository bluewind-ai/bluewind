// app/lib/utils/apps/load-apps-to-db-server.ts

import { db } from "~/db";
import { functionCalls, apps, FunctionCallStatus } from "~/db/schema";
import path from "path";
import fs from "fs";

export async function loadAppsToDB() {
  console.log("📥 Starting to load apps to database");

  const generatedAppsPath = path.join(process.cwd(), "app", "lib", "generated", "apps.ts");
  if (!fs.existsSync(generatedAppsPath)) {
    throw new Error("Generated apps file not found. Please run generate-apps first.");
  }

  const { apps: generatedApps } = await import(generatedAppsPath);

  console.log(`💾 Upserting ${generatedApps.length} apps to database`);
  for (const app of generatedApps) {
    await db
      .insert(apps)
      .values({
        functionCallId: 1,
        value: app.value,
        label: app.name,
        iconKey: app.iconKey,
        order: app.id,
      })
      .onConflictDoUpdate({
        target: [apps.value],
        set: {
          label: app.name,
          iconKey: app.iconKey,
          order: app.id,
        },
      });
  }

  const thisAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "load-apps-to-db"),
  });

  if (!thisAction) throw new Error("load-apps-to-db not found in database");

  const [functionCall] = await db
    .insert(functionCalls)
    .values({
      actionId: thisAction.id,
      status: FunctionCallStatus.COMPLETED,
      result: {
        success: true,
        appsCount: generatedApps.length,
      },
    })
    .returning();

  console.log("✅ Apps loaded to database successfully");
  return functionCall;
}

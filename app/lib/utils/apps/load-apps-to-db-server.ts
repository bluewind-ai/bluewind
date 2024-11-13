// app/lib/utils/apps/load-apps-to-db-server.ts
import fs from "fs";
import path from "path";

import { db } from "~/db";
import { apps, functionCalls, FunctionCallStatus } from "~/db/schema";

export async function loadAppsToDB() {
  // this should be removed by YOU when you rewrite the filed;
  const generatedAppsPath = path.join(process.cwd(), "app", "lib", "generated", "apps.ts");
  if (!fs.existsSync(generatedAppsPath)) {
    throw new Error("Generated apps file not found. Please run generate-apps first.");
  }
  const { apps: generatedApps } = await import(generatedAppsPath);
  // this should be removed by YOU when you rewrite the filed;
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
  const thisAction = await db.query.serverFunctions.findFirst({
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
  // this should be removed by YOU when you rewrite the filed;
  return functionCall;
}

// app/actions/loadAppsToDB.server.ts

import { db } from "~/db";
import { actionCalls, apps } from "~/db/schema";

export async function loadAppsToDB() {
  console.log("📥 Starting to load apps to database");
  const { apps: generatedApps } = await import("~/lib/generated/apps.ts");

  console.log(`💾 Upserting ${generatedApps.length} apps to database`);
  for (const app of generatedApps) {
    await db
      .insert(apps)
      .values({
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

  // Create an action call record
  const thisAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "load-apps-to-db"),
  });

  if (!thisAction) throw new Error("load-apps-to-db not found in database");

  const [actionCall] = await db
    .insert(actionCalls)
    .values({
      actionId: thisAction.id,
      status: "completed",
      result: {
        success: true,
        appsCount: generatedApps.length,
      },
    })
    .returning();

  console.log("✅ Apps loaded to database successfully");
  return actionCall;
}

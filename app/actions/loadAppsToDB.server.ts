// app/actions/loadAppsToDB.server.ts

import { db } from "~/db";
import { actionCalls, apps } from "~/db/schema";
import { apps as generatedApps } from "~/lib/generated/apps";

export async function loadAppsToDB() {
  console.log("\n=== 📥 Load Apps to DB Started ===");
  console.log(`Found ${generatedApps.length} apps to process`);

  try {
    console.log("💾 Upserting apps to database...");
    for (const app of generatedApps) {
      console.log(`  • Processing ${app.name}`);
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

    console.log("✅ All apps successfully loaded to database");
    console.log("=== 💫 Load Apps to DB Complete ===\n");
    return actionCall;
  } catch (error) {
    console.error("❌ Failed to load apps:", error);
    console.log("=== 💥 Load Apps to DB Failed ===\n");
    throw error;
  }
}

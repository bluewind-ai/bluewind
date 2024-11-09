// app/actions/loadAppsToDB.server.ts

import { db } from "~/db";
import { actionCalls, apps } from "~/db/schema";
import { apps as generatedApps } from "~/lib/generated/apps";

export async function loadAppsToDB() {
  void 0; // this should be removed by YOU when you rewrite the filed;
  void 0; // this should be removed by YOU when you rewrite the filed;

  try {
    void 0; // this should be removed by YOU when you rewrite the filed;
    for (const app of generatedApps) {
      void 0; // this should be removed by YOU when you rewrite the filed;
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

    void 0; // this should be removed by YOU when you rewrite the filed;
    void 0; // this should be removed by YOU when you rewrite the filed;
    return actionCall;
  } catch (error) {
    void 0; // this should be removed by YOU when you rewrite the filed;
    void 0; // this should be removed by YOU when you rewrite the filed;
    throw error;
  }
}

// app/actions/load-apps-to-db.server.ts

import { db } from "~/db";
import { apps } from "~/lib/generated/apps";
import { functionCalls, actions, FunctionCallStatus, ActionType } from "~/db/schema";

export async function loadAppsToDb() {
  for (const app of apps) {
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

  let thisAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "load-apps-to-db"),
  });

  if (!thisAction) {
    const [newAction] = await db
      .insert(actions)
      .values({
        name: "load-apps-to-db",
        type: ActionType.SYSTEM,
      })
      .returning();
    thisAction = newAction;
  }

  const [functionCall] = await db
    .insert(functionCalls)
    .values({
      actionId: thisAction.id,
      status: FunctionCallStatus.COMPLETED,
      result: {
        success: true,
        appsCount: apps.length,
      },
    })
    .returning();

  return functionCall;
}

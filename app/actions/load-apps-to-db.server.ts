// app/actions/load-apps-to-db.server.ts

import { db } from "~/db";
import {
  apps as appsTable,
  functionCalls,
  actions,
  FunctionCallStatus,
  ActionType,
} from "~/db/schema";
import { apps as appsData } from "~/lib/generated/apps";

export async function loadAppsToDb() {
  for (const app of appsData) {
    await db
      .insert(appsTable)
      .values({
        value: app.value,
        label: app.name,
        iconKey: app.iconKey,
        order: app.id,
      })
      .onConflictDoUpdate({
        target: [appsTable.value],
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
        appsCount: appsData.length,
      },
    })
    .returning();

  return functionCall;
}
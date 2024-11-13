// app/functions/load-apps-to-db.server.ts
import { db } from "~/db";
import {
  ActionType,
  apps as appsTable,
  functionCalls,
  FunctionCallStatus,
  serverFunctions,
} from "~/db/schema";
import { createAction } from "~/lib/action-builder.server";
import { apps as appsData } from "~/lib/generated/apps";

export const loadAppsToDb = createAction("load-apps-to-db", async () => {
  for (const app of appsData) {
    await db
      .insert(appsTable)
      .values({
        value: app.value,
        label: app.name,
        iconKey: app.iconKey,
        order: app.id,
        functionCallId: 1,
      })
      .onConflictDoUpdate({
        target: [appsTable.value],
        set: {
          label: app.name,
          iconKey: app.iconKey,
          order: app.id,
          functionCallId: 1,
        },
      });
  }
  let thisAction = await db.query.serverFunctions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "load-apps-to-db"),
  });
  if (!thisAction) {
    const [newAction] = await db
      .insert(serverFunctions)
      .values({
        name: "load-apps-to-db",
        type: ActionType.SYSTEM,
        functionCallId: 1,
      })
      .returning();
    thisAction = newAction;
  }
  // At this point TypeScript knows thisAction cannot be undefined since we either
  // found it or created it
  const [functionCall] = await db
    .insert(functionCalls)
    .values({
      actionId: thisAction!.id, // Add non-null assertion since we know it exists
      status: FunctionCallStatus.COMPLETED,
      result: {
        success: true,
        appsCount: appsData.length,
      },
    })
    .returning();
  return functionCall;
});

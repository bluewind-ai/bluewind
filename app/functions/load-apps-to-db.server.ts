// app/functions/load-apps-to-db.server.ts
import {
  apps as appsTable,
  functionCalls,
  FunctionCallStatus,
  serverFunctions,
  ServerFunctionType,
} from "~/db/schema";
import { apps as appsData } from "~/lib/generated/apps";
import { db } from "~/middleware";

export const loadAppsToDb = async () => {
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
  const request = await db.query.requests.findFirst();
  if (!request) {
    throw new Error("No request found");
  }
  if (!thisAction) {
    const [newAction] = await db
      .insert(serverFunctions)
      .values({
        requestId: request.id,
        name: "load-apps-to-db",
        type: ServerFunctionType.SYSTEM,
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
      requestId: request.id,
      serverFunctionId: thisAction!.id, // Add non-null assertion since we know it exists
      status: FunctionCallStatus.COMPLETED,
      result: {
        success: true,
        appsCount: appsData.length,
      },
    })
    .returning();
  return functionCall;
};

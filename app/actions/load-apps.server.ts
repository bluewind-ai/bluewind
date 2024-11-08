// app/actions/load-apps.server.ts

import { db } from "~/db";
import { actionCalls } from "~/db/schema";

export const loadApps = async () => {
  // For now, we'll just return a static JSON representing our apps
  // This matches what we see in routes with the + folders
  const apps = [
    {
      id: 1,
      name: "Actions",
      type: "app",
      iconKey: "actions",
      children: [],
    },
    {
      id: 2,
      name: "Objects",
      type: "app",
      iconKey: "database",
      children: [],
    },
    {
      id: 3,
      name: "Selectors",
      type: "app",
      iconKey: "selectors",
      children: [],
    },
  ];

  // Create an action call record
  const thisAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "load-apps"),
  });

  if (!thisAction) throw new Error("load-apps not found in database");

  const [actionCall] = await db
    .insert(actionCalls)
    .values({
      actionId: thisAction.id,
      status: "completed",
      result: {
        success: true,
        apps,
      },
    })
    .returning();

  return actionCall;
};

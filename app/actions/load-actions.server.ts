// app/actions/load-actions.server.ts

import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";
import fs from "node:fs/promises";
import path from "node:path";

export const loadActions = async () => {
  // Log the directory we're looking in
  const actionsDir = path.join(process.cwd(), "app", "actions");
  void 0 // this should be removed by YOU when you rewrite the filed;

  const files = await fs.readdir(actionsDir);
  void 0 // this should be removed by YOU when you rewrite the filed;

  const actionFiles = files.filter((file) => file.endsWith(".server.ts"));
  void 0 // this should be removed by YOU when you rewrite the filed;

  const actionNames = actionFiles.map((file) => path.basename(file, ".server.ts"));
  void 0 // this should be removed by YOU when you rewrite the filed;

  const results = [];

  for (const name of actionNames) {
    const existing = await db.query.actions.findFirst({
      where: (fields, { eq }) => eq(fields.name, name),
    });

    if (!existing) {
      await db
        .insert(actions)
        .values({
          name,
          type: "action",
        })
        .returning();
      results.push({ name, status: "created" });
    } else {
      results.push({ name, status: "exists" });
    }
  }

  // Create an action call record
  const thisAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "load-actions"),
  });

  if (!thisAction) throw new Error("load-actions not found in database");

  const [actionCall] = await db
    .insert(actionCalls)
    .values({
      actionId: thisAction.id,
      status: "completed",
      result: {
        success: true,
        actionsFound: actionNames,
        results,
      },
    })
    .returning();

  return actionCall;
};

// app/actions/load-actions.server.ts

import { json } from "@remix-run/node";
import { db } from "~/db";
import { actions } from "~/db/schema";
import fs from "node:fs/promises";
import path from "node:path";

export const loadActions = async () => {
  console.log("Starting loadActionsAction");

  const actionsDir = path.join(process.cwd(), "app", "actions");
  console.log("Actions directory:", actionsDir);

  const files = await fs.readdir(actionsDir);
  console.log("Found files:", files);

  const actionFiles = files.filter((file) => file.endsWith(".server.ts"));
  console.log("Action files:", actionFiles);

  const actionNames = actionFiles.map((file) => path.basename(file, ".server.ts"));
  console.log("Action names:", actionNames);

  const results = [];

  for (const name of actionNames) {
    const existing = await db.query.actions.findFirst({
      where: (fields, { eq }) => eq(fields.name, name),
    });

    if (!existing) {
      await db.insert(actions).values({ name }).returning();
      results.push({ name, status: "created" });
    } else {
      results.push({ name, status: "exists" });
    }
  }

  return json({
    success: true,
    actionsFound: actionNames,
    results,
  });
};

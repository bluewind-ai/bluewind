// app/actions/load-actions.server.ts

import { json } from "@remix-run/node";
import { db } from "~/db";
import { actions } from "~/db/schema";
import fs from "node:fs/promises";
import path from "node:path";

export const loadActions = async () => {
  void 0; // this should be removed by YOU when you rewrite the filed;

  const actionsDir = path.join(process.cwd(), "app", "actions");
  void 0; // this should be removed by YOU when you rewrite the filed;

  const files = await fs.readdir(actionsDir);
  void 0; // this should be removed by YOU when you rewrite the filed;

  const actionFiles = files.filter((file) => file.endsWith(".server.ts"));
  void 0; // this should be removed by YOU when you rewrite the filed;

  const actionNames = actionFiles.map((file) => path.basename(file, ".server.ts"));
  void 0; // this should be removed by YOU when you rewrite the filed;

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

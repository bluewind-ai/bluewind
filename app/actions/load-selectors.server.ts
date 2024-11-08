// app/actions/load-selectors.server.ts

import { json } from "@remix-run/node";
import { db } from "~/db";
import { actions } from "~/db/schema";
import fs from "node:fs/promises";
import path from "node:path";

export const loadSelectors = async () => {
  const selectorsDir = path.join(process.cwd(), "app", "selectors");

  const files = await fs.readdir(selectorsDir);

  const selectorFiles = files.filter((file) => file.endsWith(".server.ts"));

  const selectorNames = selectorFiles.map((file) => path.basename(file, ".server.ts"));

  const results = [];

  for (const name of selectorNames) {
    const existing = await db.query.actions.findFirst({
      where: (fields, { eq }) => eq(fields.name, name),
    });

    if (!existing) {
      await db
        .insert(actions)
        .values({
          name,
          type: "selector", // This is the key addition
        })
        .returning();
      results.push({ name, status: "created" });
    } else {
      results.push({ name, status: "exists" });
    }
  }

  return json({
    success: true,
    selectorsFound: selectorNames,
    results,
  });
};

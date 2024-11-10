// app/actions/load-actions.server.ts

import { type ActionType, actions } from "~/db/schema";
import { db } from "~/db";
import { eq } from "drizzle-orm";

type ActionMap = {
  name: string;
  type: ActionType;
}[];

export const USER_ACTIONS: ActionMap = [
  {
    name: "load-apps-to-db",
    type: "system",
  },
  {
    name: "reset-db",
    type: "system",
  },
  {
    name: "load-csv-data",
    type: "system",
  },
  {
    name: "load-files",
    type: "system",
  },
  {
    name: "load-selectors",
    type: "system",
  },
  {
    name: "load-actions",
    type: "system",
  },
];

export async function loadActions() {
  const results: { name: string; status: string }[] = [];

  for (const { name, type } of USER_ACTIONS) {
    const action = await db.query.actions.findFirst({
      where: (fields) => eq(fields.name, name),
    });

    if (!action) {
      await db.insert(actions).values({ name, type });
      results.push({ name, status: "created" });
    } else {
      results.push({ name, status: "exists" });
    }
  }

  return results;
}

// app/routes/api.load-apps.ts

import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { loadAppsToDb } from "~/functions/load-apps-to-db.server";

export const action: ActionFunction = async () => {
  const result = await loadAppsToDb();
  return json(result);
};

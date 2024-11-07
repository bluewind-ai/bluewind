// app/lib/generated/actions.ts
// This file is auto-generated. Do not edit it manually.

import { master } from "~/actions/master.server";
import { loadCsvData } from "~/actions/load-csv-data.server";
import { loadActions } from "~/actions/load-actions.server";
import { goNext } from "~/actions/go-next.server";
import { withActionMiddleware } from "~/lib/action-middleware.server";

const rawActions = {
  "master": master,
  "load-csv-data": loadCsvData,
  "load-actions": loadActions,
  "go-next": goNext
} as const;

// Wrap each action with the middleware
export const actions = Object.fromEntries(
  Object.entries(rawActions).map(([name, fn]) => [
    name,
    withActionMiddleware(name, (args) => fn(args))
  ])
) as typeof rawActions;
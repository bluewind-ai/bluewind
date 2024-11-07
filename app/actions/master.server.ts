// app/actions/master.server.ts

/* eslint-disable @typescript-eslint/no-unused-vars */

import type { ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";

export async function master(_args: ActionFunctionArgs) {
  // First get or create the load-csv-data action
  const existingAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "load-csv-data"),
  });

  const loadCsvAction =
    existingAction ||
    (
      await db
        .insert(actions)
        .values({
          name: "load-csv-data",
        })
        .returning()
    )[0];

  // Create an action call for approval
  const actionCall = await db
    .insert(actionCalls)
    .values({
      actionId: loadCsvAction.id,
      status: "ready_for_approval",
    })
    .returning();

  return actionCall[0];
}

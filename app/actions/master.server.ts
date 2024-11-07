// app/actions/master.server.ts

/* eslint-disable @typescript-eslint/no-unused-vars */

import type { ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";

export async function master(_args: ActionFunctionArgs) {
  // First ensure the master action itself is created
  const loadCsvAction = await db
    .insert(actions)
    .values({
      name: "load-csv-data",
    })
    .returning();

  // Create an action call for approval
  const actionCall = await db
    .insert(actionCalls)
    .values({
      actionId: loadCsvAction[0].id,
      status: "ready_for_approval",
    })
    .returning();

  return actionCall[0];
}

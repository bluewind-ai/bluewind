// app/routes/action-calls/action.server.ts

import { json, type ActionFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { master } from "~/actions/master.server";

export const action: ActionFunction = async (args) => {
  if (!args.params.id) {
    throw new Response("Not Found", { status: 404 });
  }

  try {
    await master(args);
  } catch (error) {
    if (error instanceof Response && error.status === 418) {
      const debugMessage = await error.text();
      return json({ debugMessage });
    }
    throw error;
  }

  await db
    .update(actionCalls)
    .set({ status: "completed" })
    .where(eq(actionCalls.id, parseInt(args.params.id)));

  return json({ success: true });
};

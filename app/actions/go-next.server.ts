// app/actions/go-next.server.ts

import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { master } from "./master.server";

const actionMap = {
  master,
} as const;

export async function goNext(args: ActionFunctionArgs) {
  dd("cdsds");
  const currentActionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(args.params.id || "")),
    with: {
      action: true,
    },
  });

  if (!currentActionCall) {
    throw new Response("Action call not found", { status: 404 });
  }

  if (currentActionCall.status === "ready_for_approval") {
    const action = actionMap[currentActionCall.action.name as keyof typeof actionMap];
    await action(args);

    await db
      .update(actionCalls)
      .set({ status: "completed" })
      .where(eq(actionCalls.id, currentActionCall.id));

    return json({ actionCall: currentActionCall });
  }

  throw new Response(`Action ${currentActionCall.id} is not ready for approval`, { status: 400 });
}

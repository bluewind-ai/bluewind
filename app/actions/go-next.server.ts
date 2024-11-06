// app/actions/go-next.server.ts

import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { json, type ActionFunctionArgs } from "@remix-run/node";

export async function goNext(args: ActionFunctionArgs) {
  void 0;

  void 0;
  const currentActionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(args.params.id || "")),
    with: {
      action: true,
    },
  });

  // Let's test our new dd!

  void 0;

  if (!currentActionCall) {
    void 0;
    throw new Response("Action call not found", { status: 404 });
  }

  if (currentActionCall.status === "ready_for_approval") {
    void 0;
    void 0;

    void 0;
    await db
      .update(actionCalls)
      .set({ status: "completed" })
      .where(eq(actionCalls.id, currentActionCall.id));
    void 0;

    return json({
      actionCall: currentActionCall,
    });
  }
  throw new Response(`Action ${currentActionCall.id} is not ready for approval`, { status: 400 });
}

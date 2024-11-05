// app/actions/go-next.server.ts

import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { master } from "./master.server";
import { dd } from "~/lib/debug";

const actionMap = {
  master,
} as const;

export async function goNext(args: ActionFunctionArgs) {
  console.log("🟢 Starting goNext");

  console.log("🟡 Fetching action call from DB");
  const currentActionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(args.params.id || "")),
    with: {
      action: true,
    },
  });

  // Let's test our new dd!
  dd({
    message: "Testing our new dd function",
    currentActionCall,
    args,
  });

  console.log("🟡 Found action call:", currentActionCall);

  if (!currentActionCall) {
    console.log("🔴 Action call not found");
    throw new Response("Action call not found", { status: 404 });
  }

  if (currentActionCall.status === "ready_for_approval") {
    console.log("🟡 Action is ready for approval, executing...");
    const action = actionMap[currentActionCall.action.name as keyof typeof actionMap];
    const actionResult = await action(args);
    console.log("🟢 Action executed successfully:", actionResult);

    console.log("🟡 Updating action call status...");
    await db
      .update(actionCalls)
      .set({ status: "completed" })
      .where(eq(actionCalls.id, currentActionCall.id));
    console.log("🟢 Status updated successfully");

    return json({
      actionCall: currentActionCall,
    });
  }

  throw new Response(`Action ${currentActionCall.id} is not ready for approval`, { status: 400 });
}

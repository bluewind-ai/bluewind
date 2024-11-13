// app/routes/api.bootstrap.ts

import { type ActionFunctionArgs, redirect } from "@remix-run/node";

import { db } from "~/db";
import { functionCalls, serverFunctions } from "~/db/schema";
import { ActionType, FunctionCallStatus } from "~/db/schema/types";
import { actionMiddleware } from "~/lib/middleware";

async function _action(_args: ActionFunctionArgs) {
  console.log("Starting bootstrap action", new Date().toISOString());
  const debugRecords = await db.select().from(serverFunctions);
  console.log("DEBUG - ALL server functions:", debugRecords, new Date().toISOString());

  const [masterAction] = await db
    .insert(serverFunctions)
    .values({
      name: "master",
      type: ActionType.SYSTEM,
    })
    .returning();
  console.log("Inserted master action:", masterAction, new Date().toISOString());

  await db
    .insert(functionCalls)
    .values({
      actionId: masterAction.id,
      status: FunctionCallStatus.READY_FOR_APPROVAL,
    })
    .returning();

  await new Promise((resolve) => setTimeout(resolve, 1));
  return redirect("/");
}

export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}

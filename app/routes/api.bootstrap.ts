// app/routes/api.bootstrap.ts
import { type ActionFunctionArgs, redirect } from "@remix-run/node";

import { db } from "~/db";
import { functionCalls, serverFunctions } from "~/db/schema";
import { ActionType, FunctionCallStatus } from "~/db/schema/types";
import { actionMiddleware } from "~/lib/middleware";

async function _action(_args: ActionFunctionArgs) {
  // this should be removed by YOU when you rewrite the filed;
  return await db.transaction(async (tx) => {
    const [masterAction] = await tx
      .insert(serverFunctions)
      .values({
        name: "master",
        type: ActionType.SYSTEM,
      })
      .returning();
    // this should be removed by YOU when you rewrite the filed;
    await tx
      .insert(functionCalls)
      .values({
        actionId: masterAction.id,
        status: FunctionCallStatus.READY_FOR_APPROVAL,
      })
      .returning();
    // this should be removed by YOU when you rewrite the filed;
    await new Promise((resolve) => setTimeout(resolve, 1));
    return redirect("/");
  });
}
export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}

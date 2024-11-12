// app/routes/_index.tsx

import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "~/db";
import { ActionType, functionCalls, FunctionCallStatus, serverFunctions } from "~/db/schema";
import { loaderMiddleware } from "~/lib/middleware";
import { path } from "~/utils/path";

// eslint-disable-next-line unused-imports/no-unused-vars
async function _loader(args: LoaderFunctionArgs) {
  const masterAction = await db.query.serverFunctions.findFirst({
    where: eq(serverFunctions.name, "master"),
  });

  if (!masterAction) {
    const [newMasterAction] = await db
      .insert(serverFunctions)
      .values({
        name: "master",
        type: ActionType.SYSTEM,
      })
      .returning();

    const [newFunctionCall] = await db
      .insert(functionCalls)
      .values({
        actionId: newMasterAction.id,
        status: FunctionCallStatus.READY_FOR_APPROVAL,
      })
      .returning();

    throw redirect(path.to.agents(newFunctionCall.id));
  }

  const masterFunctionCall = await db.query.functionCalls.findFirst({
    where: and(eq(functionCalls.actionId, masterAction.id), isNull(functionCalls.parentId)),
  });

  if (!masterFunctionCall) {
    const [newFunctionCall] = await db
      .insert(functionCalls)
      .values({
        actionId: masterAction.id,
        status: FunctionCallStatus.READY_FOR_APPROVAL,
      })
      .returning();

    throw redirect(path.to.agents(newFunctionCall.id));
  }

  throw redirect(path.to.agents(masterFunctionCall.id));
}

export async function loader(args: LoaderFunctionArgs) {
  return await loaderMiddleware(args, () => _loader(args));
}

export default function Index() {
  return null;
}

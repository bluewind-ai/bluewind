// app/routes/_index.tsx

import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { path } from "~/utils/path";
import { db } from "~/db";
import { actions, ActionType, functionCalls, FunctionCallStatus } from "~/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { beforeLoader } from "~/lib/middleware";

// eslint-disable-next-line unused-imports/no-unused-vars
async function _loader(args: LoaderFunctionArgs) {
  const masterAction = await db.query.actions.findFirst({
    where: eq(actions.name, "master"),
  });

  if (!masterAction) {
    const [newMasterAction] = await db
      .insert(actions)
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
  await beforeLoader(args);
  return await _loader(args);
}

export default function Index() {
  return null;
}

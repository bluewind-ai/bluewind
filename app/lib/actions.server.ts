// app/lib/actions.server.ts
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import {
  functionCalls,
  FunctionCallStatus,
  serverFunctions,
  ServerFunctionType,
} from "~/db/schema";
import { db } from "~/middleware";

import { createAction, suspend } from "./action-builder.server";

export async function findNextOrCreateMaster() {
  // First check for any existing function calls that need approval
  const existingActionCall = await db.query.functionCalls.findFirst({
    where: and(
      isNull(functionCalls.parentId),
      inArray(functionCalls.status, [FunctionCallStatus.READY_FOR_APPROVAL] as const),
    ),
    with: {
      action: true,
    },
  });
  if (existingActionCall) {
    return existingActionCall;
  }
  // If no function calls need approval, get the last function call
  const lastActionCall = await db.query.functionCalls.findFirst({
    orderBy: [desc(functionCalls.id)],
  });
  if (lastActionCall) {
    return lastActionCall;
  }
  // If no function calls exist at all, create the first master action
  const masterAction = await db.query.serverFunctions.findFirst({
    where: eq(serverFunctions.name, "master"),
  });
  const request = await db.query.requests.findFirst();
  if (!request) {
    throw new Error("No request found");
  }
  const action =
    masterAction ||
    (
      await db
        .insert(serverFunctions)
        .values({ requestId: request.id, name: "master", type: ServerFunctionType.SYSTEM })
        .returning()
    )[0];
  const [newActionCall] = await db
    .insert(functionCalls)
    .values({
      requestId: request.id,
      actionId: action.id,
      status: FunctionCallStatus.READY_FOR_APPROVAL,
    })
    .returning();
  return newActionCall;
}
export const actions: Record<string, () => Promise<unknown>> = {
  master: createAction("master", async () => {
    await suspend();
  }),
  "load-files": createAction("load-files", async () => {
    // Add your load-files action implementation here
    // this should be removed by YOU when you rewrite the filed;
    await suspend();
  }),
};

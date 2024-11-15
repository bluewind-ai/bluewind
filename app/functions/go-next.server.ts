// app/functions/go-next.server.ts
import { eq } from "drizzle-orm";

import { functionCalls, FunctionCallStatus } from "~/db/schema";
import { db } from "~/middleware";

export async function goNext() {
  // this should be removed by YOU when you rewrite the filed;
  const readyFunctionCalls = await db.query.functionCalls.findMany({
    where: eq(functionCalls.status, FunctionCallStatus.READY_FOR_APPROVAL),
    with: {
      serverFunction: true,
    },
  });
  // this should be removed by YOU when you rewrite the filed;
  if (readyFunctionCalls.length === 0) {
    throw new Error("No function calls ready for approval");
  }
  if (readyFunctionCalls.length > 1) {
    throw new Error("Multiple function calls ready for approval");
  }
  const [functionCall] = readyFunctionCalls;
  // Update status to running
  await db
    .update(functionCalls)
    .set({ status: FunctionCallStatus.RUNNING })
    .where(eq(functionCalls.id, functionCall.id));
  // this should be removed by YOU when you rewrite the filed;
  // Run the action
  // TODO: Actually run the action when we have the action execution system in place
  // Update status to completed
  await db
    .update(functionCalls)
    .set({ status: FunctionCallStatus.COMPLETED })
    .where(eq(functionCalls.id, functionCall.id));
  // this should be removed by YOU when you rewrite the filed;
  return functionCall;
}

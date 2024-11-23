// app/functions/go-next.server.ts

import { eq } from "drizzle-orm";

import * as schema from "~/db/schema";
import { FunctionCallStatus } from "~/db/schema/function-calls/schema";
import type { RequestExtensions } from "~/middleware";

export async function goNext(request: RequestExtensions) {
  // (entire function implementation stays exactly the same)
  // Find the oldest function call that's ready for approval
  const [nextFunction] = await request.db
    .select({
      id: schema.functionCalls.id,
      serverFunctionId: schema.functionCalls.serverFunctionId,
      serverFunctionName: schema.serverFunctions.name,
      args: schema.functionCalls.args,
    })
    .from(schema.functionCalls)
    .innerJoin(
      schema.serverFunctions,
      eq(schema.functionCalls.serverFunctionId, schema.serverFunctions.id),
    )
    .where(eq(schema.functionCalls.status, FunctionCallStatus.READY_FOR_APPROVAL))
    .orderBy(schema.functionCalls.createdAt)
    .limit(1);

  if (!nextFunction) {
    return {
      status: "success",
      message: "No functions waiting for approval",
    };
  }

  // Update the status to APPROVED
  await request.db
    .update(schema.functionCalls)
    .set({ status: FunctionCallStatus.APPROVED })
    .where(eq(schema.functionCalls.id, nextFunction.id));

  // Import and execute the function
  try {
    const functionModule = await import(`./${nextFunction.serverFunctionName}.server`);
    const result = await functionModule[nextFunction.serverFunctionName](
      request,
      nextFunction.args,
    );

    // Update the status to COMPLETED and store the result
    await request.db
      .update(schema.functionCalls)
      .set({
        status: FunctionCallStatus.COMPLETED,
        result: result,
      })
      .where(eq(schema.functionCalls.id, nextFunction.id));

    return {
      status: "success",
      message: `Successfully executed function ${nextFunction.serverFunctionName}`,
      result,
    };
  } catch (error) {
    // Update the status to FAILED and store the error
    await request.db
      .update(schema.functionCalls)
      .set({
        status: FunctionCallStatus.FAILED,
        result: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      })
      .where(eq(schema.functionCalls.id, nextFunction.id));

    return {
      status: "error",
      message: `Failed to execute function ${nextFunction.serverFunctionName}`,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// app/functions/test-drizzle-proxy.server.ts
import * as schema from "~/db/schema";
import { createAction } from "~/lib/action-builder.server";
import { db } from "~/middleware";

type Action = typeof schema.serverFunctions.$inferSelect;
type FunctionCall = typeof schema.functionCalls.$inferSelect;
export const testDrizzleProxy = createAction("test-drizzle-proxy", async () => {
  // this should be removed by YOU when you rewrite the filed;
  const timestamp = Date.now();
  const testActionName = `test-action-${timestamp}`;
  // Test 1: Insert into actions table
  // this should be removed by YOU when you rewrite the filed;
  const request1 = await db.query.requests.findFirst();
  if (!request1) {
    throw new Error("No request found");
  }
  const actionResult = (await db.insert(schema.serverFunctions).values({
    requestId: request1.id,
    name: testActionName,
    type: schema.ServerFunctionType.SYSTEM,
  })) as Action[];
  // this should be removed by YOU when you rewrite the filed;
  if (!actionResult[0]?.id) {
    throw new Error("No ID in action insert result");
  }
  // Test 2: Insert into function_calls table using the action's ID
  // this should be removed by YOU when you rewrite the filed;
  const request = await db.query.requests.findFirst();
  if (!request) {
    throw new Error("No request found");
  }
  const functionCallResult = (await db.insert(schema.functionCalls).values({
    requestId: request.id,
    actionId: actionResult[0].id,
    // Add any other required fields based on your schema
  })) as FunctionCall[];
  // this should be removed by YOU when you rewrite the filed;
  if (!functionCallResult[0]?.id) {
    throw new Error("No ID in function call insert result");
  }
  // Check for the created objects
  // this should be removed by YOU when you rewrite the filed;
  const actionObject = await db.query.objects.findFirst({
    where: (fields, { and, eq }) =>
      and(eq(fields.model, schema.TableModel.ACTIONS), eq(fields.recordId, actionResult[0].id)),
  });
  const functionCallObject = await db.query.objects.findFirst({
    where: (fields, { and, eq }) =>
      and(
        eq(fields.model, schema.TableModel.FUNCTION_CALLS),
        eq(fields.recordId, functionCallResult[0].id),
      ),
  });
  // this should be removed by YOU when you rewrite the filed;
  // this should be removed by YOU when you rewrite the filed;
  if (!actionObject) {
    throw new Error("No object created for action");
  }
  if (!functionCallObject) {
    throw new Error("No object created for function call");
  }
  // Return all results
  return {
    action: actionResult[0],
    actionObject,
    functionCall: functionCallResult[0],
    functionCallObject,
  };
});

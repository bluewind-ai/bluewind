// app/functions/test-drizzle-proxy.server.ts

import { db } from "~/db";
import * as schema from "~/db/schema";
import { ActionType } from "~/db/schema/types";
import { createAction } from "~/lib/action-builder.server";

type Action = typeof schema.serverFunctions.$inferSelect;
type FunctionCall = typeof schema.functionCalls.$inferSelect;

export const testDrizzleProxy = createAction("test-drizzle-proxy", async () => {
  void 0; // this should be removed by YOU when you rewrite the filed;

  const timestamp = Date.now();
  const testActionName = `test-action-${timestamp}`;

  try {
    // Test 1: Insert into actions table
    void 0; // this should be removed by YOU when you rewrite the filed;
    const actionResult = (await db.insert(schema.serverFunctions).values({
      name: testActionName,
      type: ActionType.SYSTEM,
    })) as Action[];

    void 0; // this should be removed by YOU when you rewrite the filed;

    if (!actionResult[0]?.id) {
      throw new Error("No ID in action insert result");
    }

    // Test 2: Insert into function_calls table using the action's ID
    void 0; // this should be removed by YOU when you rewrite the filed;
    const functionCallResult = (await db.insert(schema.functionCalls).values({
      actionId: actionResult[0].id,
      // Add any other required fields based on your schema
    })) as FunctionCall[];

    void 0; // this should be removed by YOU when you rewrite the filed;

    if (!functionCallResult[0]?.id) {
      throw new Error("No ID in function call insert result");
    }

    // Check for the created objects
    void 0; // this should be removed by YOU when you rewrite the filed;

    const actionObject = await db.query.objects.findFirst({
      where: (fields, { and, eq }) =>
        and(eq(fields.model, "actions"), eq(fields.recordId, actionResult[0].id)),
    });

    const functionCallObject = await db.query.objects.findFirst({
      where: (fields, { and, eq }) =>
        and(eq(fields.model, "function_calls"), eq(fields.recordId, functionCallResult[0].id)),
    });

    void 0; // this should be removed by YOU when you rewrite the filed;
    void 0; // this should be removed by YOU when you rewrite the filed;

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
  } catch (error) {
    void 0; // this should be removed by YOU when you rewrite the filed;
    throw error;
  }
});

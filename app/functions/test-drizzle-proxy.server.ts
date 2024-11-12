// app/functions/test-drizzle-proxy.server.ts

import { db } from "~/db";
import * as schema from "~/db/schema";
import { ActionType } from "~/db/schema/types";

type Action = typeof schema.actions.$inferSelect;
type FunctionCall = typeof schema.functionCalls.$inferSelect;

export async function testDrizzleProxy() {
  console.log("Starting drizzle proxy test");

  const timestamp = Date.now();
  const testActionName = `test-action-${timestamp}`;

  try {
    // Test 1: Insert into actions table
    console.log("Test 1: Inserting test action:", testActionName);
    const actionResult = (await db.insert(schema.actions).values({
      name: testActionName,
      type: ActionType.SYSTEM,
    })) as Action[];

    console.log("Action insert result:", actionResult);

    if (!actionResult[0]?.id) {
      throw new Error("No ID in action insert result");
    }

    // Test 2: Insert into function_calls table using the action's ID
    console.log("Test 2: Inserting test function call for action:", actionResult[0].id);
    const functionCallResult = (await db.insert(schema.functionCalls).values({
      actionId: actionResult[0].id,
      // Add any other required fields based on your schema
    })) as FunctionCall[];

    console.log("Function call insert result:", functionCallResult);

    if (!functionCallResult[0]?.id) {
      throw new Error("No ID in function call insert result");
    }

    // Check for the created objects
    console.log("Checking for created objects");

    const actionObject = await db.query.objects.findFirst({
      where: (fields, { and, eq }) =>
        and(eq(fields.model, "actions"), eq(fields.recordId, actionResult[0].id)),
    });

    const functionCallObject = await db.query.objects.findFirst({
      where: (fields, { and, eq }) =>
        and(eq(fields.model, "function_calls"), eq(fields.recordId, functionCallResult[0].id)),
    });

    console.log("Action object result:", actionObject);
    console.log("Function call object result:", functionCallObject);

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
    console.error("Error in test:", error);
    throw error;
  }
}

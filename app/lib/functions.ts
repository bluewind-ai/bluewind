// app/lib/functions.ts

import { eq } from "drizzle-orm";

import { functionCalls, serverFunctions } from "~/db/schema";
import { FunctionCallStatus } from "~/db/schema/function-calls/schema";
import { master } from "~/functions/master.server";
import { root } from "~/functions/root.server";
import type { ExtendedContext } from "~/middleware";
import { db } from "~/middleware/main";

type ServerFunction = (c: ExtendedContext) => Promise<any>;

function wrapFunction(fn: ServerFunction, name: string) {
  return async (c: ExtendedContext) => {
    // dd("wrapFunction", { name });
    const [serverFunction] = await db
      .select()
      .from(serverFunctions)
      .where(eq(serverFunctions.name, name))
      .limit(1);

    if (!serverFunction) {
      throw new Error(`Server function ${name} not found`);
    }

    const [functionCall] = await db
      .insert(functionCalls)
      .values({
        serverFunctionId: serverFunction.id,
        status: FunctionCallStatus.READY_FOR_APPROVAL,
        requestId: c.requestId,
        functionCallId: c.functionCallId || 1, // Added default
        args: null,
        result: null,
      })
      .returning();

    try {
      const result = await fn(c);
      await db
        .update(functionCalls)
        .set({
          status: FunctionCallStatus.COMPLETED,
          result,
        })
        .where(eq(functionCalls.id, functionCall.id));
      return result;
    } catch (error) {
      await db
        .update(functionCalls)
        .set({
          status: FunctionCallStatus.FAILED,
          result: { error: error instanceof Error ? error.message : "Unknown error" },
        })
        .where(eq(functionCalls.id, functionCall.id));
      throw error;
    }
  };
}

export const functions = {
  root,
  master: wrapFunction(master, "master"),
} as const;

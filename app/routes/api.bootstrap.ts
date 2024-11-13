// app/routes/api.bootstrap.ts

import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { eq, sql } from "drizzle-orm";

import { functionCalls, serverFunctions } from "~/db/schema";
import { ActionType, FunctionCallStatus } from "~/db/schema/types";
import { actionMiddleware } from "~/lib/middleware";

async function _action(args: ActionFunctionArgs) {
  console.log("\n=== Starting Bootstrap Action ===");
  console.log("Starting bootstrap action", new Date().toISOString());

  const { db } = args.context; // This db is already configured with requestId

  console.log("\n--- Raw SQL Check ---");
  const rawCheck = await db.execute(sql`SELECT * FROM server_functions WHERE name = 'master'`);
  console.log("Raw SQL result:", rawCheck);

  console.log("\n--- First Select ---");
  const debugRecords = await db.select().from(serverFunctions);
  console.log("DEBUG - ALL server functions (1st select):", debugRecords);

  console.log("\n--- Double Check ---");
  const doubleCheck = await db
    .select()
    .from(serverFunctions)
    .where(eq(serverFunctions.name, "master"));
  console.log("DEBUG - Double checking master:", doubleCheck);

  console.log("\n--- Attempting Insert ---");
  const [masterAction] = await db
    .insert(serverFunctions)
    .values({
      name: "master",
      type: ActionType.SYSTEM,
    })
    .returning();
  console.log("Insert result:", masterAction);

  console.log("\n--- Function Call Insert ---");
  await db
    .insert(functionCalls)
    .values({
      actionId: masterAction.id,
      status: FunctionCallStatus.READY_FOR_APPROVAL,
    })
    .returning();

  await new Promise((resolve) => setTimeout(resolve, 1));
  return redirect("/");
}

export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}

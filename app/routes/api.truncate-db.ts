// app/routes/api.truncate-db.ts

import { type ActionFunctionArgs, redirect } from "@remix-run/node";

import { functionCalls, objects, serverFunctions } from "~/db/schema";
import { actionMiddleware } from "~/lib/middleware";

async function _action(args: ActionFunctionArgs) {
  const { db } = args.context;

  console.log("Truncating database tables...");

  const deleteObjects = db.delete(objects);
  await deleteObjects.returning({ id: objects.id });
  console.log("Deleted objects");

  const deleteFunctionCalls = db.delete(functionCalls);
  await deleteFunctionCalls.returning({ id: functionCalls.id });
  console.log("Deleted function calls");

  const deleteServerFunctions = db.delete(serverFunctions);
  await deleteServerFunctions.returning({ id: serverFunctions.id });
  console.log("Deleted server functions");

  await new Promise((resolve) => setTimeout(resolve, 0));
  return redirect("/");
}

export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}

// app/routes/api.truncate-db.ts

import { type ActionFunctionArgs, redirect } from "@remix-run/node";

import { db } from "~/db";
import { functionCalls, objects, serverFunctions } from "~/db/schema";
import { actionMiddleware } from "~/lib/middleware";

async function _action(args: ActionFunctionArgs) {
  const deleteObjects = db.delete(objects);
  console.log("Delete objects SQL:", deleteObjects.toSQL());
  const objectsDeleted = await deleteObjects.returning({ id: objects.id });
  console.log("Objects deleted:", objectsDeleted);

  const deleteFunctionCalls = db.delete(functionCalls);
  console.log("Delete function calls SQL:", deleteFunctionCalls.toSQL());
  const functionCallsDeleted = await deleteFunctionCalls.returning({ id: functionCalls.id });
  console.log("Function calls deleted:", functionCallsDeleted);

  const deleteServerFunctions = db.delete(serverFunctions);
  console.log("Delete server functions SQL:", deleteServerFunctions.toSQL());
  const serverFunctionsDeleted = await deleteServerFunctions.returning({ id: serverFunctions.id });
  console.log("Server functions deleted:", serverFunctionsDeleted);

  await new Promise((resolve) => setTimeout(resolve, 0));

  return redirect("/");
}

export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}

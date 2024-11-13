// app/routes/api.truncate-db.ts
import { type ActionFunctionArgs, redirect } from "@remix-run/node";

import { db } from "~/db";
import { functionCalls, objects, serverFunctions } from "~/db/schema";
import { actionMiddleware } from "~/lib/middleware";
// eslint-disable-next-line unused-imports/no-unused-vars
async function _action(args: ActionFunctionArgs) {
  const deleteObjects = db.delete(objects);
  await deleteObjects.returning({ id: objects.id });
  const deleteFunctionCalls = db.delete(functionCalls);
  await deleteFunctionCalls.returning({ id: functionCalls.id });
  const deleteServerFunctions = db.delete(serverFunctions);
  await deleteServerFunctions.returning({ id: serverFunctions.id });
  await new Promise((resolve) => setTimeout(resolve, 0));
  return redirect("/");
}
export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}

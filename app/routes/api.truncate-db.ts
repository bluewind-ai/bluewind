// app/routes/api.truncate-db.ts

import { type ActionFunctionArgs } from "@remix-run/node";

import { db } from "~/db";
import { functionCalls, objects, serverFunctions } from "~/db/schema";
import { actionMiddleware } from "~/lib/middleware";

// eslint-disable-next-line unused-imports/no-unused-vars
async function _action(args: ActionFunctionArgs) {
  await db.delete(objects);
  await db.delete(functionCalls);
  await db.delete(serverFunctions);

  return {
    success: true,
    message: "All database tables truncated successfully",
  };
}

export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}

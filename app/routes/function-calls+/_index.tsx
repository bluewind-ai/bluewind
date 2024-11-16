// app/routes/function-calls+/_index.tsx

import { type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { NewMain } from "~/components/new-main";
import { functionCalls } from "~/db/schema";
import { createFunctionCalls } from "~/functions/create-function-calls.server";
import type { RequestExtensions } from "~/middleware";

export async function loader(args: LoaderFunctionArgs) {
  const { db } = args.context;
  const tableObjects = await db.query.functionCalls.findMany({
    orderBy: functionCalls.id,
  });
  return {
    tableObjects,
  };
}

export async function action(args: ActionFunctionArgs) {
  const { request, context } = args;
  await createFunctionCalls(request, context as RequestExtensions);
  return null;
}

export default function FunctionCalls() {
  const { tableObjects } = useLoaderData<typeof loader>();
  return <NewMain data={tableObjects} />;
}

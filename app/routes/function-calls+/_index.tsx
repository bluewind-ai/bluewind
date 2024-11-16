// app/routes/function-calls+/_index.tsx
import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { NewMain } from "~/components/new-main";
import { functionCalls } from "~/db/schema";

export async function loader(args: LoaderFunctionArgs) {
  const { db } = args.context;
  const tableObjects = await db.query.functionCalls.findMany({
    orderBy: functionCalls.id,
  });
  return {
    tableObjects,
  };
}
export default function FunctionCalls() {
  const { tableObjects } = useLoaderData<typeof loader>();
  return <NewMain data={tableObjects} />;
}

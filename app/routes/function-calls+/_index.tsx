// app/routes/function-calls+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { functionCalls } from "~/db/schema";
import { NewMain } from "~/components/new-main";

export async function loader(args: LoaderFunctionArgs) {
  const { db } = args.context;
  const tableObjects = await db.query.functionCalls.findMany({
    orderBy: functionCalls.id,
  });

  console.log("Loader data:", tableObjects);

  return {
    tableObjects,
  };
}

export default function FunctionCalls() {
  const { tableObjects } = useLoaderData<typeof loader>();

  console.log("Component data:", tableObjects);

  return <NewMain data={tableObjects} />;
}

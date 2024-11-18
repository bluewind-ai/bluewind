// app/routes/function-calls+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { NewMain } from "~/components/new-main";
import { getFunctionCalls } from "~/functions/get-function-calls.server";

export async function loader(args: LoaderFunctionArgs) {
  return getFunctionCalls(args.context, args.request.url);
}

export default function FunctionCalls() {
  const tableObjects = useLoaderData<typeof loader>();
  return <NewMain data={tableObjects} />;
}
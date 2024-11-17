// app/routes/debug-logs+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { NewMain } from "~/components/new-main";
import { getDebugLogs } from "~/functions/get-debug-logs.server";

export async function loader(args: LoaderFunctionArgs) {
  return getDebugLogs(args.context, args.request.url);
}

export default function DebugLogs() {
  const tableObjects = useLoaderData<typeof loader>();
  return <NewMain data={tableObjects} />;
}

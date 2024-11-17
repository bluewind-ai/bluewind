// app/routes/server-functions+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { NewMain } from "~/components/new-main";
import { getServerFunctions } from "~/functions/get-server-functions.server";

export async function loader(args: LoaderFunctionArgs) {
  return getServerFunctions(args.context, args.request.url);
}

export default function ServerFunctions() {
  const tableObjects = useLoaderData<typeof loader>();
  return <NewMain data={tableObjects} />;
}

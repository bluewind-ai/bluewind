// app/routes/objects+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { NewMain } from "~/components/new-main";
import { getObjects } from "~/functions/get-objects.server";

export async function loader(args: LoaderFunctionArgs) {
  return getObjects(args.context, args.request.url);
}

export default function Objects() {
  const tableObjects = useLoaderData<typeof loader>();
  return <NewMain data={tableObjects} />;
}
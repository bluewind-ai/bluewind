// app/routes/models+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { NewMain } from "~/components/new-main";
import { getModels } from "~/functions/get-models.server";

export async function loader(args: LoaderFunctionArgs) {
  return getModels(args.context, args.request.url);
}

export default function Models() {
  const tableObjects = useLoaderData<typeof loader>();
  return <NewMain data={tableObjects} />;
}
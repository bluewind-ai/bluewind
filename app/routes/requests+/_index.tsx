// app/routes/requests+/_index.tsx
import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { NewMain } from "~/components/new-main";
import { getRequests } from "~/functions/get-requests.server";

export async function loader(args: LoaderFunctionArgs) {
  return getRequests(args.context);
}
export default function Requests() {
  const tableObjects = useLoaderData<typeof loader>();
  return <NewMain data={tableObjects} />;
}

// app/routes/requests+/_index.tsx
import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { NewMain } from "~/components/new-main";
import { requests } from "~/db/schema";

export async function loader(args: LoaderFunctionArgs) {
  const { db } = args.context;
  const tableObjects = await db.query.requests.findMany({
    orderBy: requests.id,
  });
  return {
    tableObjects,
  };
}
export default function Requests() {
  const { tableObjects } = useLoaderData<typeof loader>();
  return <NewMain data={tableObjects} />;
}

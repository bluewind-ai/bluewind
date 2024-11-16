// app/routes/objects+/_index.tsx
import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { NewMain } from "~/components/new-main";
import { objects } from "~/db/schema";

export async function loader(args: LoaderFunctionArgs) {
  const { db } = args.context;
  const tableObjects = await db.query.objects.findMany({
    orderBy: objects.id,
  });
  return {
    tableObjects,
  };
}
export default function Objects() {
  const { tableObjects } = useLoaderData<typeof loader>();
  return <NewMain data={tableObjects} />;
}

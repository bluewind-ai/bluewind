// app/routes/users+/_index.tsx
import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { NewMain } from "~/components/new-main";
import { users } from "~/db/schema";

export async function loader(args: LoaderFunctionArgs) {
  const { db } = args.context;
  const tableObjects = await db.query.users.findMany({
    orderBy: users.id,
  });
  return {
    tableObjects,
  };
}
export default function Users() {
  const { tableObjects } = useLoaderData<typeof loader>();
  return <NewMain data={tableObjects} />;
}

// app/routes/users+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { users } from "~/db/schema";
import { NewMain } from "~/components/new-main";

export async function loader(args: LoaderFunctionArgs) {
  const { db } = args.context;
  const tableObjects = await db.query.users.findMany({
    orderBy: users.id,
  });

  console.log("Loader data:", tableObjects);

  return {
    tableObjects,
  };
}

export default function Users() {
  const { tableObjects } = useLoaderData<typeof loader>();

  console.log("Component data:", tableObjects);

  return <NewMain data={tableObjects} />;
}

// app/routes/objects+/users.tsx

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { GenericTableView } from "~/components/GenericTableView";
import { db } from "~/db";

export async function loader() {
  // Raw select * query using Drizzle
  const users = await db.query.users.findMany();
  return json({ data: users });
}

export default function UsersTableRoute() {
  const { data } = useLoaderData<typeof loader>();
  return <GenericTableView data={data} />;
}

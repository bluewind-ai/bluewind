// app/routes/objects+/action-calls.tsx

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { GenericTableView } from "~/components/GenericTableView";
import { db } from "~/db";

export async function loader() {
  const actionCalls = await db.query.actionCalls.findMany();
  return json({ data: actionCalls });
}

export default function ActionCallsTableRoute() {
  const { data } = useLoaderData<typeof loader>();
  return <GenericTableView data={data} />;
}

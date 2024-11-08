// app/routes/objects+/actions.tsx

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { NewMain } from "~/components/NewMain";
import { db } from "~/db";

export async function loader() {
  const actions = await db.query.actions.findMany();

  // Transform the data to match ActionRecord type expected by NewMain
  const tableData = actions.map((action) => ({
    id: action.id,
    name: action.name,
    displayName: action.name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    lastCallStatus: "never_run", // We can enhance this later
    lastRunAt: null,
    totalCalls: 0,
  }));

  return json({ data: tableData });
}

export default function ActionsTableRoute() {
  const { data } = useLoaderData<typeof loader>();
  return <NewMain data={data} />;
}

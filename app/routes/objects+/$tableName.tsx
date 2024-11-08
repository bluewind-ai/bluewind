// app/routes/objects+/$tableName.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { GenericTableView } from "~/components/GenericTableView";
import { db } from "~/db";
import { TABLES } from "~/db/schema";

export async function loader({ params }: LoaderFunctionArgs) {
  const { tableName } = params;

  const tableEntry = Object.entries(TABLES).find(([_, config]) => config.urlName === tableName);
  if (!tableEntry) {
    throw new Error(`Table ${tableName} not found`);
  }

  const [key] = tableEntry;

  let data;
  switch (key) {
    case "users":
      data = await db.query.users.findMany();
      break;
    case "sessions":
      data = await db.query.sessions.findMany();
      break;
    case "actions":
      data = await db.query.actions.findMany();
      break;
    case "actionCalls":
      data = await db.query.actionCalls.findMany();
      break;
    case "requestErrors":
      data = await db.query.requestErrors.findMany();
      break;
    case "debugLogs":
      data = await db.query.debugLogs.findMany();
      break;
    default:
      throw new Error(`Table ${tableName} not found`);
  }

  return json({ data });
}

export default function TableRoute() {
  const { data } = useLoaderData<typeof loader>();
  return <GenericTableView data={data} />;
}

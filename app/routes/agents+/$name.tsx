// app/routes/agents+/$name.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { GenericTableView } from "~/components/generic-table-view";
import { db } from "~/db";
import { TABLES } from "~/db/schema";

async function _loader({ params }: LoaderFunctionArgs) {
  const { name } = params;

  if (name === "function-calls") {
    const data = await db.query.functionCalls.findMany({
      with: {
        action: true,
        parent: true,
      },
      orderBy: (functionCalls) => [functionCalls.createdAt],
    });

    return { data };
  }

  const tableEntry = Object.entries(TABLES).find(([_, config]) => config.urlName === name);
  if (!tableEntry) {
    throw new Error(`Table ${name} not found`);
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
    case "requestErrors":
      data = await db.query.requestErrors.findMany();
      break;
    case "debugLogs":
      data = await db.query.debugLogs.findMany();
      break;
    default:
      throw new Error(`Table ${name} not found`);
  }

  return { data };
}

export async function loader(args: LoaderFunctionArgs) {
  await beforeLoader(args);
  const response = await _loader(args);
  await afterLoader(args, response);
  return json(response);
}

export default function TableRoute() {
  const { data } = useLoaderData<typeof loader>();
  return <GenericTableView data={data} />;
}

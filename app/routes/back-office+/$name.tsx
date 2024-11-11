// app/routes/back-office+/$name.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { GenericTableView } from "~/components/generic-table-view";
import { db } from "~/db";
import { TABLES } from "~/db/schema";
import { Button } from "~/components/ui/button";
import { beforeLoader } from "~/lib/middleware";

async function _loader({ params }: LoaderFunctionArgs) {
  const { name } = params;

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
    case "functionCalls":
      data = await db.query.functionCalls.findMany();
      break;
    case "requestErrors":
      data = await db.query.requestErrors.findMany();
      break;
    case "debugLogs":
      data = await db.query.debugLogs.findMany();
      break;
    case "objects":
      data = await db.query.objects.findMany();
      break;
    default:
      throw new Error(`Table ${name} not found`);
  }

  return { data };
}

export async function loader(args: LoaderFunctionArgs) {
  await beforeLoader(args);
  return await _loader(args);
}

export default function TableRoute() {
  const { data } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const extraColumns = [
    {
      id: "actions",
      header: "Actions",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (row: any) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            fetcher.submit(
              {},
              {
                method: "get",
                action: `/run-function/${row.name}`,
                preventScrollReset: true,
              },
            );
          }}
        >
          Run
        </Button>
      ),
    },
  ];

  return <GenericTableView data={data} extraColumns={extraColumns} />;
}

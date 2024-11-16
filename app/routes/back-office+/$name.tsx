// app/routes/back-office+/$name.tsx
import { type LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";

import { GenericTableView } from "~/components/generic-table-view";
import { Button } from "~/components/ui/button";
import { TABLES } from "~/db/schema";
import { loaderMiddleware } from "~/lib/middleware";
import { db } from "~/middleware/main";

async function _loader({ params }: LoaderFunctionArgs) {
  const { name } = params;
  const tableEntry = Object.entries(TABLES).find(([_, config]) => config.urlName === name);
  if (!tableEntry) {
    throw new Error(`Table ${name} not found`);
  }
  const [key] = tableEntry;
  let data;
  switch (key) {
    case TABLES.users.urlName:
      data = await db.query.users.findMany();
      break;
    case TABLES.sessions.urlName:
      data = await db.query.sessions.findMany();
      break;
    case TABLES.serverFunctions.urlName:
      data = await db.query.serverFunctions.findMany();
      break;
    case TABLES.functionCalls.urlName:
      data = await db.query.functionCalls.findMany();
      break;
    case TABLES.debugLogs.urlName:
      data = await db.query.debugLogs.findMany();
      break;
    case TABLES.objects.urlName:
      data = await db.query.objects.findMany();
      break;
    default:
      throw new Error(`Table ${name} not found`);
  }
  return { data };
}
export async function loader(args: LoaderFunctionArgs) {
  return await loaderMiddleware(args, () => _loader(args));
}
export default function TableRoute() {
  const { data } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const extraColumns = [
    {
      id: TABLES.serverFunctions.urlName,
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
                method: "post",
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

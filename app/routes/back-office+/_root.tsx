// app/routes/back-office+/_root.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { NavigationTree } from "~/components/NavigationTree";
import { getTableMetadata } from "~/db/schema";
import type { ViewData } from "~/routes/_app";

const views: ViewData[] = [
  {
    value: "objects",
    label: "Database",
    iconKey: "database",
  },
  {
    value: "back-office",
    label: "Back Office",
    iconKey: "table",
  },
];

const navigationData = {
  id: 0,
  name: "Database",
  type: "root" as const,
  iconKey: "database",
  children: getTableMetadata().map((table, index) => ({
    id: index + 1,
    name: table.displayName,
    urlName: table.urlName,
    type: "file" as const,
    children: [],
  })),
};

export async function loader({ request: _request }: LoaderFunctionArgs) {
  return json({
    navigationData,
    views,
  });
}

export default function ObjectsRoot() {
  const { navigationData, views } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData} views={views} />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

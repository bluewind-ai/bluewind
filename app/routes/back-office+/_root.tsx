// app/routes/back-office+/_root.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { NavigationTree, type NavigationNode } from "~/components/NavigationTree";
import { getTableMetadata } from "~/db/schema";

export async function loader({ request: _request }: LoaderFunctionArgs) {
  const navigationData: NavigationNode = {
    id: 0,
    name: "Database",
    type: "root",
    iconKey: "database",
    children: getTableMetadata().map((table, index) => ({
      id: index + 1,
      name: table.displayName,
      urlName: table.urlName,
      type: "file" as const,
      children: [] as NavigationNode[],
    })),
  };

  return json({
    navigationData,
  });
}

export default function ObjectsRoot() {
  const { navigationData } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData as NavigationNode} />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
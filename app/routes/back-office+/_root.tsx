// app/routes/back-office+/_root.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { NavigationTree, type NavigationNode } from "~/components/NavigationTree";
import { getTableMetadata , apps } from "~/db/schema";
import { db } from "~/db";

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

  const appsData = await db.select().from(apps).orderBy(apps.order);

  return json({
    navigationData,
    apps: appsData,
  });
}

export default function ObjectsRoot() {
  const { navigationData, apps } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData as NavigationNode} apps={apps} />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

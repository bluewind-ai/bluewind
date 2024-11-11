// app/routes/back-office+/_root.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";

import { type NavigationNode, NavigationTree } from "~/components/navigation-tree";
import { db } from "~/db";
import { apps, getTableMetadata } from "~/db/schema";
import { loaderMiddleware } from "~/lib/middleware";

// eslint-disable-next-line unused-imports/no-unused-vars
async function _loader(args: LoaderFunctionArgs) {
  const navigationData: NavigationNode = {
    id: 0,
    name: "Database",
    type: "root",
    iconKey: "database",
    children: getTableMetadata().map((table, index) => ({
      id: index + 1,
      name: table.displayName,
      to: `/back-office/${table.urlName}`,
      type: "file" as const,
      children: [] as NavigationNode[],
    })),
  };

  const appsData = await db.select().from(apps).orderBy(apps.order);

  return {
    navigationData,
    apps: appsData,
  };
}

export async function loader(args: LoaderFunctionArgs) {
  return await loaderMiddleware(args, () => _loader(args));
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

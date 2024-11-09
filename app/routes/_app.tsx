// app/routes/_app.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { NavigationTree } from "~/components/NavigationTree";
import type { NavigationNode } from "~/components/NavigationTree";

export type ViewData = {
  value: string;
  label: string;
  iconKey: string;
};

const views = [
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
] as const;

const navigationData: NavigationNode = {
  id: 0,
  name: "BlueWind",
  type: "root" as const,
  iconKey: "favicon",
  children: [
    {
      id: 1,
      name: "Database",
      type: "app" as const,
      iconKey: "database",
      children: [],
    },
    {
      id: 2,
      name: "Actions",
      type: "app" as const,
      iconKey: "actions",
      children: [],
    },
    {
      id: 3,
      name: "Selectors",
      type: "app" as const,
      iconKey: "selectors",
      children: [],
    },
  ],
};

export async function loader({ request: _request }: LoaderFunctionArgs) {
  return json({
    views,
    navigationData,
  });
}

export default function AppLayout() {
  const { views, navigationData } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData} views={views} />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

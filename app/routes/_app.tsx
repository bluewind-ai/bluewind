// app/routes/_app.tsx

import { Outlet } from "@remix-run/react";
import { NavigationTree } from "~/components/NavigationTree";
import type { NavigationNode } from "~/components/NavigationTree";

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

export default function AppLayout() {
  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData} />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

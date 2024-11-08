// app/routes/_index.tsx -> rename to app/routes/_app.tsx

import { Outlet } from "@remix-run/react";
import { NavigationTree } from "~/components/NavigationTree";

const navigationData = {
  id: 0,
  name: "BlueWind",
  type: "root",
  iconKey: "favicon",
  children: [
    {
      id: 1,
      name: "Database",
      type: "app",
      iconKey: "database",
      children: [],
    },
    {
      id: 2,
      name: "Actions",
      type: "app",
      iconKey: "actions",
      children: [],
    },
    {
      id: 3,
      name: "Selectors",
      type: "app",
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

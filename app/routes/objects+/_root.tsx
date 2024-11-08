// app/routes/objects+/_root.tsx

import { Outlet } from "@remix-run/react";
import { NavigationTree } from "~/components/NavigationTree";

const navigationData = {
  id: 0,
  name: "Database",
  type: "root" as const,
  iconKey: "database",
  children: [
    {
      id: 1,
      name: "Users",
      type: "file" as const,
      children: [],
    },
    {
      id: 2,
      name: "Sessions",
      type: "file" as const,
      children: [],
    },
    {
      id: 3,
      name: "Actions",
      type: "file" as const,
      children: [],
    },
    {
      id: 4,
      name: "Action Calls",
      type: "file" as const,
      children: [],
    },
    {
      id: 5,
      name: "Request Errors",
      type: "file" as const,
      children: [],
    },
    {
      id: 6,
      name: "Debug Logs",
      type: "file" as const,
      children: [],
    },
  ],
};

export default function ObjectsLayout() {
  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData} />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

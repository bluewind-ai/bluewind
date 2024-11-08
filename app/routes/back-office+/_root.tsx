// app/routes/objects+/_root.tsx

import { Outlet } from "@remix-run/react";
import { NavigationTree } from "~/components/NavigationTree";
import { getTableMetadata } from "~/db/schema";

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

export default function ObjectsRoot() {
  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData} />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

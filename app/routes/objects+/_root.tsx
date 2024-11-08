// app/routes/objects+/_root.tsx

import * as React from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getTables } from "~/actions/get-tables.server";
import { NavigationTree } from "~/components/NavigationTree";
import { Network } from "lucide-react";

type NavigationNode = {
  id: number;
  name: string;
  icon?: React.ReactNode | string;
  type: "root" | "app" | "file";
  children: NavigationNode[];
};

export async function loader() {
  const tables = getTables();

  const navigationData: NavigationNode = {
    id: 0,
    name: "BlueWind",
    type: "root",
    icon: "/favicon.ico",
    children: [
      {
        id: 1,
        name: "Database",
        type: "app",
        icon: <Network className="h-5 w-5" />,
        children: tables.map((tableName, index) => ({
          id: index + 2,
          name: tableName,
          type: "file",
          children: [],
        })),
      },
      // Here we can add other apps like Actions, Selectors etc
    ],
  };

  return json({ navigationData });
}

export default function ObjectsRoot() {
  const { navigationData } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData} />
      <div className="flex-1 p-4">
        <h2 className="text-2xl font-bold mb-4">Database Explorer</h2>
        <p>Select a table from the explorer to view its contents.</p>
      </div>
    </div>
  );
}

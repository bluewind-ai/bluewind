// app/routes/_app.tsx

import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { NavigationTree, type NavigationNode } from "~/components/NavigationTree";
import { NewMain } from "~/components/NewMain";

export type ViewData = {
  value: string;
  label: string;
  iconKey: string;
};

export const views: ViewData[] = [
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

export async function loader() {
  const navigationData: NavigationNode = {
    id: 0,
    name: "Root",
    type: "root" as const,
    children: [
      {
        id: 1,
        name: "Database Objects",
        type: "app" as const,
        children: [],
      },
      {
        id: 2,
        name: "Actions",
        type: "app" as const,
        children: [],
      },
    ],
  };

  return json({
    navigationData,
    views,
  });
}

export default function Index() {
  const { navigationData } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData} />
      <div className="flex-1">
        <NewMain data={[]} />
      </div>
    </div>
  );
}

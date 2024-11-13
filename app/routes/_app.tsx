// app/routes/_app.tsx
import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { type NavigationNode, NavigationTree } from "~/components/navigation-tree";
import { NewMain } from "~/components/new-main";
import { apps } from "~/db/schema";
import { loaderMiddleware } from "~/lib/middleware";

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
// eslint-disable-next-line unused-imports/no-unused-vars
async function _loader(args: LoaderFunctionArgs) {
  const { db } = args.context;
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
  const appsData = await db.select().from(apps).orderBy(apps.order);
  return {
    navigationData,
    views,
    apps: appsData,
  };
}
export async function loader(args: LoaderFunctionArgs) {
  return await loaderMiddleware(args, () => _loader(args));
}
export default function Index() {
  const { navigationData, apps } = useLoaderData<typeof loader>();
  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData} apps={apps} />
      <div className="flex-1">
        <NewMain data={[]} />
      </div>
    </div>
  );
}

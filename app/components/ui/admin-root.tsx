// app/components/ui/admin-root.tsx

import { Outlet } from "@remix-run/react";

import { BackOfficeTree } from "~/components/back-office-tree";
import type { NavigationNode } from "~/components/navigation-tree";
import { NavigationTree } from "~/components/navigation-tree";
import { NewMain } from "~/components/new-main";
import { ServerFunctionsButtons } from "~/components/server-functions-buttons";

type AdminLayoutProps = {
  navigationData: NavigationNode;
  backOfficeData: NavigationNode;
  apps: any[];
  mainData: any[];
};

export function AdminLayout({ navigationData, backOfficeData, apps, mainData }: AdminLayoutProps) {
  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData} apps={apps} />
      <div className="flex-1">
        <ServerFunctionsButtons />
        <NewMain data={mainData} />
        <Outlet />
      </div>
      <BackOfficeTree data={backOfficeData} apps={apps} />
    </div>
  );
}

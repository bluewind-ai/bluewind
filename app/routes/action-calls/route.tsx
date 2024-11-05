// app/routes/action-calls/route.tsx

import { Outlet, useLoaderData } from "@remix-run/react";
import { ActivityBar } from "~/components/activity-bar";
import { json, type LoaderFunction } from "@remix-run/node";
import { findNextOrCreateMaster } from "~/lib/actions.server";

export const loader: LoaderFunction = async () => {
  console.log("=== LAYOUT LOADER START ===");
  const lastAction = await findNextOrCreateMaster();
  console.log("Last action from layout:", lastAction);
  return json({ lastAction });
};

export default function ActionCallsLayout() {
  console.log("=== RENDERING LAYOUT ===");
  const { lastAction } = useLoaderData<typeof loader>();
  console.log("Layout data:", lastAction);

  return (
    <div className="flex min-h-screen">
      <div className="w-12">
        <ActivityBar lastAction={lastAction} />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

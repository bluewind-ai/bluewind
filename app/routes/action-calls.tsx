// app/routes/action-calls.tsx

import { Outlet, useLoaderData } from "@remix-run/react";
import { ActivityBar } from "~/components/activity-bar";
import { json, type LoaderFunction } from "@remix-run/node";
import { findNextOrCreateMaster } from "~/lib/actions.server";

export const loader: LoaderFunction = async () => {
  const lastAction = await findNextOrCreateMaster();
  return json({ lastAction });
};

export default function ActionCallsLayout() {
  const { lastAction } = useLoaderData<typeof loader>();

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

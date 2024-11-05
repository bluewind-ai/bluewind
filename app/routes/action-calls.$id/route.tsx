// app/routes/action-calls.$id/route.tsx

import { useLoaderData, useRouteError } from "@remix-run/react";
import { ActivityBar } from "~/components/activity-bar";
import type { loader } from "./loader.server"; // Updated this line

interface RouteError {
  type: string;
  message: string;
  data: unknown;
}

export default function Route() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-screen">
      <ActivityBar />
      <main className="flex-1 bg-black text-green-400 p-4 font-mono">
        <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
      </main>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError() as RouteError;

  return (
    <div className="flex min-h-screen">
      <ActivityBar />
      <main className="flex-1 bg-black text-green-400 p-4 font-mono">
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(
            {
              type: "Debug",
              message: "Debug Dump",
              data: error,
            },
            null,
            2,
          )}
        </pre>
      </main>
    </div>
  );
}

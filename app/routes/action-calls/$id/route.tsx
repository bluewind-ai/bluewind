// app/routes/action-calls/$id/route.tsx

import { useRouteError } from "@remix-run/react";
import { ActivityBar } from "~/components/activity-bar";

interface RouteError {
  data?: string | unknown;
  message?: string;
}

export function ErrorBoundary() {
  const error = useRouteError() as RouteError;

  const errorContent = error.data;

  return (
    <div className="flex min-h-screen">
      <ActivityBar />
      <main className="flex-1 bg-black text-green-400 p-4 font-mono">
        <pre className="whitespace-pre-wrap">{JSON.stringify(errorContent, null, 2)}</pre>
      </main>
    </div>
  );
}

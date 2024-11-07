// app/routes/actions.$actionId/route.tsx

import { useRouteError } from "@remix-run/react";
import { json } from "@remix-run/node";

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="p-4">
      <div className="text-red-500">
        <h2 className="text-lg font-semibold mb-2">Error loading action</h2>
        <pre className="bg-slate-100 p-4 rounded">
          {error instanceof Error ? error.message : "Route not found"}
        </pre>
      </div>
    </div>
  );
}

export default function ActionRoute() {
  return (
    <div className="p-4">
      <h1>Action not implemented yet</h1>
    </div>
  );
}

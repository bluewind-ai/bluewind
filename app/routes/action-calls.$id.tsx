// app/routes/action-calls.$id.tsx

import { useState } from "react";
import { useLoaderData, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { ActionCallTree } from "~/components/ui/ActionCallTree";
import { ActionCallDetails } from "~/components/ActionCallDetails";
import { GoNextButton } from "~/components/GoNextButton";
import { DebugPanel } from "~/components/DebugPanel";
import type { loader } from "~/routes/action-calls/$id/loader";

export { action } from "~/routes/action-calls/$id/action";
export { loader } from "~/routes/action-calls/$id/loader";

export default function ActionCallPage() {
  const { result, treeData } = useLoaderData<typeof loader>();
  const [debugMessage, setDebugMessage] = useState<string | null>(null);

  return (
    <div className="min-h-screen relative">
      <div className="flex min-h-screen">
        <div className="w-64">
          <ActionCallTree initialTreeData={treeData} />
        </div>
        <div className="flex-1 p-4 flex flex-col relative">
          <ActionCallDetails actionCall={result.actionCall} action={result.action} />
          <div className="flex-1 relative">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
              <GoNextButton actionCall={result.actionCall} onDebugData={setDebugMessage} />
            </div>
            <DebugPanel debugMessage={debugMessage} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    let errorData;
    try {
      errorData = JSON.parse(error.data);
    } catch {
      errorData = error.data;
    }

    return (
      <div className="error-container">
        <pre className="whitespace-pre-wrap">{JSON.stringify(errorData, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="error-container">
      <h1>Something went wrong</h1>
      <pre>{error instanceof Error ? error.message : "Unknown error"}</pre>
    </div>
  );
}

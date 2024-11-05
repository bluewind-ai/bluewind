// app/routes/action-calls/$id/route.tsx

import { useLoaderData } from "@remix-run/react";
import { ActionCallTree } from "~/components/ui/ActionCallTree";
import { GoNextButton } from "~/components/GoNextButton";
import { useState } from "react";
import { ActionCallDetails } from "~/components/ActionCallDetails";
import { DebugPanel } from "~/components/DebugPanel";
import type { loader } from "./loader";

export { loader } from "./loader";
export { action } from "./action";

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

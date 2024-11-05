// app/routes/action-calls/$id/route.tsx

import { useLoaderData } from "@remix-run/react";
import { ActionCallTree } from "~/components/ui/ActionCallTree";
import { GoNextButton } from "~/components/GoNextButton";
import { useState } from "react";
import { ActionCallDetails } from "~/components/ActionCallDetails";
import { DebugPanel } from "~/components/DebugPanel";
import { ActivityBar } from "~/components/activity-bar";
import type { loader } from "./loader";
import type { actionCalls } from "~/db/schema";
import type { InferSelectModel } from "drizzle-orm";

export { loader } from "./loader";
export { action } from "./action";

type ActionCall = InferSelectModel<typeof actionCalls>;

function ActionSection({ actionCall }: { actionCall: ActionCall }) {
  const [debugMessage, setDebugMessage] = useState<string | null>(null);

  return (
    <div className="flex-1 relative">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        <GoNextButton actionCall={actionCall} onDebugData={setDebugMessage} />
      </div>
      <DebugPanel debugMessage={debugMessage} />
    </div>
  );
}

export default function ActionCallPage() {
  const { result, treeData } = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-screen">
      <ActivityBar />
      <div className="flex flex-1">
        <div className="w-64">
          <ActionCallTree initialTreeData={treeData} />
        </div>
        <div className="flex-1 p-4 flex flex-col relative">
          <ActionCallDetails actionCall={result.actionCall} action={result.action} />
          <ActionSection actionCall={result.actionCall} />
        </div>
      </div>
    </div>
  );
}

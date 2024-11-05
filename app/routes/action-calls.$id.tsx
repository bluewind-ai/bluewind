// app/routes/action-calls.$id.tsx

import { json, type LoaderFunction, type ActionFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { ActionCallTree, type TreeNode } from "~/components/ui/ActionCallTree";
import { GoNextButton } from "~/components/GoNextButton";
import { useState } from "react";
import { master } from "~/actions/master.server";
import { ActionCallDetails } from "~/components/ActionCallDetails";
import { DebugPanel } from "~/components/DebugPanel";

export const loader: LoaderFunction = async ({ params }) => {
  console.log("=== SIMPLE TEST LOADER ===");
  console.log("Params:", params);

  const result = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(params.id || "0")),
    with: {
      action: true,
    },
  });

  console.log("Direct DB Result:", result);

  if (!result) {
    console.log("No result found");
    throw new Response("Not Found", { status: 404 });
  }

  const treeData: TreeNode = {
    id: result.id,
    actionName: result.action.name,
    status: result.status,
    children: [],
  };

  return json({ result: { actionCall: result, action: result.action }, treeData });
};

export const action: ActionFunction = async (args) => {
  if (!args.params.id) {
    throw new Response("Not Found", { status: 404 });
  }

  try {
    await master(args);
  } catch (error) {
    if (error instanceof Response && error.status === 418) {
      const debugMessage = await error.text();
      return json({ debugMessage });
    }
    throw error;
  }

  await db
    .update(actionCalls)
    .set({ status: "completed" })
    .where(eq(actionCalls.id, parseInt(args.params.id)));

  return json({ success: true });
};

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

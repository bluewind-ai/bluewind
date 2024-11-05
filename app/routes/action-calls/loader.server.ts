// app/routes/action-calls/loader.server.ts

import { json, type LoaderFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import type { TreeNode } from "~/components/ui/ActionCallTree";

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

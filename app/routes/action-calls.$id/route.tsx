// app/routes/action-calls.$id/route.tsx

import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";

export const loader: LoaderFunction = async ({ params }) => {
  dd("ID Route Loader", { params });
  console.log("=== ID ROUTE LOADER START ===", { params });

  if (!params.id) {
    console.log("No ID found in params");
    return json({ error: "Missing ID" }, { status: 404 });
  }

  console.log(`Looking up action call with ID: ${params.id}`);

  const actionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(params.id)),
    with: {
      action: true,
    },
  });

  console.log("Found action call:", actionCall);
  console.log("=== ID ROUTE LOADER END ===");

  return json({
    type: "Debug",
    message: "Debug Dump",
    data: actionCall,
  });
};

export default function Route() {
  const data = useLoaderData<typeof loader>();

  return (
    <main className="flex-1 bg-black text-green-400 p-4 font-mono">
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}

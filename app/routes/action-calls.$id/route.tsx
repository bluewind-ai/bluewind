// app/routes/action-calls.$id/route.tsx

import { useLoaderData, useRouteError } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { GoNextButton } from "~/components/GoNextButton";
import { DebugPanel } from "~/components/DebugPanel";
import { goNext } from "~/actions/go-next.server";

export const loader: LoaderFunction = async ({ params }) => {
  const actionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(params.id as string)),
    with: {
      action: true,
    },
  });

  return json(actionCall);
};

export const action: ActionFunction = async (args) => {
  return await goNext(args);
};

// This handles both loader and action errors
export function ErrorBoundary() {
  const error = useRouteError();
  return <DebugPanel data={error} />;
}

export default function Route() {
  const actionCall = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <GoNextButton actionCall={actionCall} />
      </div>
      <main className="flex-1 bg-black text-green-400 p-4 font-mono">
        <pre className="whitespace-pre-wrap">{JSON.stringify(actionCall, null, 2)}</pre>
      </main>
    </div>
  );
}

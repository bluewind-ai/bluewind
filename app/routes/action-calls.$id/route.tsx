// app/routes/action-calls.$id/route.tsx

import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";

export const loader: LoaderFunction = async ({ params }) => {
  dd(params);
  const actionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(params.id as string)),
    with: {
      action: true,
    },
  });

  return json(actionCall);
};

export default function Route() {
  const data = useLoaderData<typeof loader>();
  return (
    <main className="flex-1 bg-black text-green-400 p-4 font-mono">
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}

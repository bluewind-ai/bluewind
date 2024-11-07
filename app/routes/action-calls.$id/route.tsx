// app/routes/action-calls.$id/route.tsx

import { useLoaderData } from "@remix-run/react";
import { json, type LoaderFunction, type ActionFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { Main } from "~/components/Main";

export const loader: LoaderFunction = async ({ params }) => {
  console.log("[loader] Starting with params:", params);

  if (!params.id || isNaN(Number(params.id))) {
    throw new Response("Invalid ID", { status: 400 });
  }

  const actionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(params.id)),
    with: { action: true },
  });

  console.log("[loader] Found actionCall:", actionCall);
  return json(actionCall);
};

export const action: ActionFunction = async ({ params }) => {
  console.log("[action] Starting with params:", params);

  if (!params.id || isNaN(Number(params.id))) {
    return json({ error: "Invalid ID" }, { status: 400 });
  }

  const id = parseInt(params.id);

  await db.update(actionCalls).set({ status: "completed" }).where(eq(actionCalls.id, id));
  console.log("[action] Updated actionCall status to completed for id:", id);

  return json({ success: true });
};

export default function Route() {
  const actionCall = useLoaderData<typeof loader>();
  console.log("[Route] Rendering with actionCall:", actionCall);

  return <Main data={actionCall} buttonLabel="Next" />;
}

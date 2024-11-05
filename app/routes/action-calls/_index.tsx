// app/routes/action-calls/_index.tsx

import { type LoaderFunction, redirect } from "@remix-run/node";
import { findNextOrCreateMaster } from "~/lib/actions.server";

export const loader: LoaderFunction = async () => {
  const lastAction = await findNextOrCreateMaster();
  if (!lastAction) {
    throw new Response("No actions found", { status: 404 });
  }
  return redirect(`/action-calls/${lastAction.id}`);
};

export default function Index() {
  return null;
}

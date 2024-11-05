// app/routes/action-calls/_index.tsx

import { type LoaderFunction, redirect } from "@remix-run/node";
import { findNextOrCreateMaster } from "~/lib/actions.server";

export const loader: LoaderFunction = async () => {
  console.log("=== INDEX LOADER START ===");

  const lastAction = await findNextOrCreateMaster();
  console.log("Last action found:", lastAction);

  if (!lastAction) {
    console.log("No action found");
    throw new Response("No actions found", { status: 404 });
  }

  console.log("Redirecting to:", `/action-calls/${lastAction.id}`);
  return redirect(`/action-calls/${lastAction.id}`);
};

export default function Index() {
  return null;
}

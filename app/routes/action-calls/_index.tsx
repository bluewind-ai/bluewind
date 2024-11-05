// app/routes/action-calls/_index.tsx

import { type LoaderFunction, json } from "@remix-run/node";
import { findNextOrCreateMaster } from "~/lib/actions.server";

export const loader: LoaderFunction = async () => {
  const lastAction = await findNextOrCreateMaster();
  return json({ lastAction });
};

export default function Index() {
  return <div>Test Index Page</div>;
}

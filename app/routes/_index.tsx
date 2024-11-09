// app/routes/_index.tsx

import { type LoaderFunction, redirect } from "@remix-run/node";
import { findNextOrCreateMaster } from "~/lib/actions.server";
import { path } from "~/utils/path";

export const loader: LoaderFunction = async () => {
  return redirect(path.to.backOffice());
};

export default function Index() {
  return null;
}
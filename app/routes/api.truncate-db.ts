// app/routes/api.truncate-db.ts

import { redirect } from "@remix-run/node";

import { truncateDb } from "~/functions/truncate-db.server";
import type { RequestExtensions } from "~/middleware";

export async function action({ context: request }: { context: RequestExtensions }) {
  await truncateDb(request);
  return redirect("/");
}

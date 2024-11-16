// app/routes/api.bootstrap.ts
import { redirect } from "@remix-run/node";

import { bootstrap } from "~/functions/bootstrap.server";
import type { RequestExtensions } from "~/middleware";

export async function action({ context: request }: { context: RequestExtensions }) {
  await bootstrap(request);
  return redirect("/");
}

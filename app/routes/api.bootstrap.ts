// app/routes/api.bootstrap.ts
import { redirect } from "@remix-run/node";

import { bootstrap } from "~/functions/bootstrap.server";
import type { ExtendedContext } from "~/middleware";

export async function action({ context: request }: { context: ExtendedContext }) {
  await bootstrap(request);
  return redirect("/");
}

// app/routes/api.load-files.ts
import { type LoaderFunctionArgs } from "@remix-run/node";

import { loadFiles } from "~/functions/load-files.server";
import { loaderMiddleware } from "~/lib/middleware";

async function _loader(_args: LoaderFunctionArgs) {
  return await loadFiles();
}
export async function loader(args: LoaderFunctionArgs) {
  return await loaderMiddleware(args, () => _loader(args));
}

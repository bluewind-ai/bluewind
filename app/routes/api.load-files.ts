// app/routes/api.load-files.ts
import { type LoaderFunctionArgs } from "@remix-run/node";

import { loadFiles } from "~/functions/load-files.server";
import { loaderMiddleware } from "~/lib/middleware";
// eslint-disable-next-line unused-imports/no-unused-vars
async function _loader(args: LoaderFunctionArgs) {
  const result = await loadFiles();
  return result;
}
export async function loader(args: LoaderFunctionArgs) {
  return await loaderMiddleware(args, () => _loader(args));
}

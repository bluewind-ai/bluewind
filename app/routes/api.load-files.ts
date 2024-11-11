// app/routes/api.load-files.ts

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { loadFiles } from "~/functions/load-files.server";

async function _loader() {
  const result = await loadFiles();
  return result;
}

export async function loader(args: LoaderFunctionArgs) {
  await beforeLoader(args);
  const response = await _loader(args);
  await afterLoader(args, response);
  return json(response);
}

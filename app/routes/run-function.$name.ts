// app/routes/run-function.$name.ts

import { type LoaderFunctionArgs } from "@remix-run/node";

import { actions } from "~/lib/generated/actions";
import { loaderMiddleware } from "~/lib/middleware";

// eslint-disable-next-line unused-imports/no-unused-vars
async function _loader(args: LoaderFunctionArgs) {
  const { name } = args.params;

  if (!name || !(name in actions)) {
    throw new Response("Function not found", { status: 404 });
  }

  const fn = actions[name as keyof typeof actions];
  await fn();

  return { success: true };
}

export async function loader(args: LoaderFunctionArgs) {
  return await loaderMiddleware(args, () => _loader(args));
}

// app/routes/run-function.$name.ts

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { actions } from "~/lib/generated/actions";

async function _loader({ params }: LoaderFunctionArgs) {
  const { name } = params;

  if (!name || !(name in actions)) {
    throw new Response("Function not found", { status: 404 });
  }

  const fn = actions[name as keyof typeof actions];
  await fn();

  return { success: true };
}

export async function loader(args: LoaderFunctionArgs) {
  await beforeLoader(args);
  const response = await _loader(args);
  await afterLoader(args, response);
  return json(response);
}

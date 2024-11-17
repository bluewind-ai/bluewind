// app/routes/request-errors+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { NewMain } from "~/components/new-main";
import { getRequestErrors } from "~/functions/get-request-errors.server";

export async function loader(args: LoaderFunctionArgs) {
  return getRequestErrors(args.context, args.request.url);
}

export default function RequestErrors() {
  const tableObjects = useLoaderData<typeof loader>();
  return <NewMain data={tableObjects} />;
}

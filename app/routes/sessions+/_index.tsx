// app/routes/sessions+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { NewMain } from "~/components/new-main";
import { getSessions } from "~/functions/get-sessions.server";

export async function loader(args: LoaderFunctionArgs) {
  return getSessions(args.context, args.request.url);
}

export default function Sessions() {
  const tableObjects = useLoaderData<typeof loader>();
  return <NewMain data={tableObjects} />;
}

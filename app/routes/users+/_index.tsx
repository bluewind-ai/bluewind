// app/routes/users+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { NewMain } from "~/components/new-main";
import { getUsers } from "~/functions/get-users.server";

export async function loader(args: LoaderFunctionArgs) {
  return getUsers(args.context, args.request.url);
}

export default function Users() {
  const tableObjects = useLoaderData<typeof loader>();
  return <NewMain data={tableObjects} />;
}

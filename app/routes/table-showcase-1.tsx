// app/routes/table-showcase-1.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { NewMain } from "~/components/new-main";
import { STORIES } from "~/factories/stories.factory";

export async function loader(_args: LoaderFunctionArgs) {
  return {
    data: STORIES.actionRecords.basic,
  };
}
export default function TableShowcase() {
  const { data } = useLoaderData<typeof loader>();
  return <NewMain data={data} />;
}

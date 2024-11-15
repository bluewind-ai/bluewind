// app/routes/function-calls+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { NewMain } from "~/components/new-main";

export async function loader(args: LoaderFunctionArgs) {
  const { db } = args.context;
  // const url = new URL(args.request.url);
  // const functionCallId = url.searchParams.get("function-call-id");
  // if (!functionCallId) {
  //   throw new Error("Missing function-call-id parameter");
  // }

  const tableObjects = await db.query.functionCalls.findMany({
    // orderBy: functionCalls.id,
    // where: eq(objects.functionCallId, parseInt(functionCallId)),
  });

  return {
    tableObjects,
  };
}

export default function Objects() {
  const { tableObjects } = useLoaderData<typeof loader>();

  return <NewMain data={tableObjects} />;
}

// app/routes/sandbox.tsx

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { NewMain } from "~/components/NewMain";

const MOCK_DATA = [
  {
    id: 1,
    status: "COMPLETED",
    action: { name: "fetch-data" },
    createdAt: "2024-01-01T12:00:00Z",
  },
  {
    id: 2,
    status: "FAILED",
    action: { name: "process-files" },
    createdAt: "2024-01-02T14:30:00Z",
  },
  {
    id: 3,
    status: "IN_PROGRESS",
    action: { name: "send-emails" },
    createdAt: "2024-01-03T09:15:00Z",
  },
];

export async function loader() {
  // Adding a console.log to verify the route is being hit
  console.log("Loading sandbox route");
  return json({ data: MOCK_DATA });
}

export default function SandboxRoute() {
  const { data } = useLoaderData<typeof loader>();
  return <NewMain data={data} />;
}

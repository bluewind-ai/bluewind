// app/routes/action-calls.$id/route.tsx

import { useLoaderData } from "@remix-run/react";
import type { loader } from "./loader";

export default function Route() {
  const data = useLoaderData<typeof loader>();

  return (
    <main className="flex-1 bg-black text-green-400 p-4 font-mono">
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}

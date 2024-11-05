// app/routes/action-calls.$id/loader.server.ts

import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = async ({ params }) => {
  console.log("=== ID ROUTE LOADER START ===");
  console.log("Params:", params);

  if (!params.id) {
    return json(
      {
        type: "Debug",
        message: "Debug Dump",
        data: "Not Found",
      },
      { status: 200 },
    );
  }

  return json(
    {
      type: "Debug",
      message: "Debug Dump",
      data: `Loading data for ID: ${params.id}`,
    },
    { status: 200 },
  );
};

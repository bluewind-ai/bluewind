// app/routes/action-calls.$id/route.tsx

import { useLoaderData, useRouteError } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunction, LoaderArgs } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";

export const loader: LoaderFunction = async ({ params }: LoaderArgs) => {
  dd("ID Route Loader", { params });

  const actionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(params.id)), // TypeScript should know id exists here
    with: {
      action: true,
    },
  });

  console.log("Found action call:", actionCall);
  console.log("=== ID ROUTE LOADER END ===");

  return json({
    type: "Debug",
    message: "Debug Dump",
    data: actionCall,
  });
};

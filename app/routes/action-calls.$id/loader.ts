// app/routes/action-calls.$id/loader.ts

import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";

export const loader: LoaderFunction = async ({ params }) => {
  dd("test");

  console.log("=== ID ROUTE LOADER START ===", { params });

  if (!params.id) {
    console.log("No ID found in params");
    return json({ error: "Missing ID" }, { status: 404 });
  }

  console.log(`Looking up action call with ID: ${params.id}`);

  const actionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(params.id)),
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

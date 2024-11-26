// app/routes/run-route.$.tsx

import { redirect, type ActionFunction } from "@remix-run/node";

export const action: ActionFunction = async ({ request, params }) => {
  // Forward request to the API routes
  await fetch(`http://localhost:5173/api/run-route/${params["*"]}`, {
    method: request.method,
    body: request.body,
    headers: request.headers,
  });

  if (params["*"] === "reset-factory") {
    return redirect("/");
  }

  return new Response(null, { status: 200 });
};
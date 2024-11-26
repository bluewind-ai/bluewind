// app/routes/run-route.$.tsx

import type { ActionFunction,LoaderFunction } from "@remix-run/node";

export const action: ActionFunction = async ({ request, params }) => {
  // Forward request to the Hono route
  const response = await fetch(`http://localhost:5173/run-route/${params["*"]}`, {
    method: request.method,
    body: request.body,
    headers: request.headers,
  });

  return response;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const response = await fetch(`http://localhost:5173/run-route/${params["*"]}`, {
    method: request.method,
    headers: request.headers,
  });

  return response;
};

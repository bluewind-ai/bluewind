// app/routes/api.run-route.root.tsx

import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const action: ActionFunction = async ({ request }) => {
  // Call the API endpoint
  const response = await fetch("http://localhost:5173/api/run-route/root", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to execute root route");
  }

  const data = await response.json();
  const requestId = data.requestId;

  // Redirect to the requests page with the ID
  return redirect(`/requests/${requestId}`);
};

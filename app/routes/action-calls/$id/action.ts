// app/routes/action-calls/$id/action.ts

import type { ActionFunction } from "@remix-run/node";
import { goNext } from "~/actions/go-next.server";

export const action: ActionFunction = async (args) => {
  if (!args.params.id) {
    throw new Response("Not Found", { status: 404 });
  }

  try {
    // Use goNext instead of directly calling master
    return await goNext(args);
  } catch (error) {
    // Pass through any error responses
    if (error instanceof Response) {
      return error;
    }
    throw error;
  }
};

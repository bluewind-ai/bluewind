// app/routes/action-calls/$id/action.ts

import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { goNext } from "~/actions/go-next.server";

export const action: ActionFunction = async (args) => {
  if (!args.params.id) {
    return json({ debugMessage: "Not Found" }, { status: 404 });
  }

  try {
    return await goNext(args);
  } catch (error) {
    // Instead of throwing/returning the error response, we'll format it as debug message
    let debugMessage;
    if (error instanceof Error) {
      debugMessage = error.message;
    } else if (error instanceof Response) {
      debugMessage = await error.text();
    } else {
      debugMessage = "Unknown error occurred";
    }

    return json(
      {
        debugMessage,
        success: false,
      },
      {
        status: 200, // Important: return 200 to prevent navigation
      },
    );
  }
};

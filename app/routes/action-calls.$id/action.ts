// app/routes/action-calls.$id/action.ts

import type { ActionFunction } from "@remix-run/node";
import { goNext } from "~/actions/go-next.server";

export const action: ActionFunction = async (args) => {
  return await goNext(args);
};

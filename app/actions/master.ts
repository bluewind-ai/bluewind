// app/actions/master.ts

import { withActionMiddleware, suspend } from "~/lib/action-middleware.server";

async function masterAction() {
  // First suspend
  suspend();

  // This would be the actual logic after approval
  return true;
}

export const master = withActionMiddleware("master", masterAction);

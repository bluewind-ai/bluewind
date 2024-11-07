// app/lib/wrapped-actions.server.ts

import { withActionMiddleware } from "./action-middleware.server";
import { actions as rawActions } from "./generated/actions";

// Pre-wrap all actions with middleware
export const wrappedActions = Object.fromEntries(
  Object.entries(rawActions).map(([name, fn]) => [
    name,
    withActionMiddleware(name, (args) => fn(args)),
  ]),
) as typeof rawActions;

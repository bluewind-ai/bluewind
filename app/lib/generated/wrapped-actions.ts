// app/lib/generated/wrapped-actions.ts

// This file is auto-generated. Do not edit it manually.

import { actions } from "./actions";
import { withActionMiddleware } from "~/lib/action-middleware.server";

// Wrap each action with the middleware
export const wrappedActions = Object.fromEntries(
  Object.entries(actions).map(([name, fn]) => [
    name,
    withActionMiddleware(name, (args) => fn(args)),
  ]),
) as typeof actions;

// app/lib/action-builder.server.ts

import { withActionMiddleware } from "./action-middleware.server";

export function createAction(name: string, fn: () => Promise<any>) {
  const wrappedFn = withActionMiddleware(name, fn);
  return wrappedFn;
}

// app/api/context.ts
import type { AppLoadContext } from "@remix-run/node";
import type { Context } from "hono";

import { db } from "~/middleware/main";

export function createLoadContext(c: Context, _options: unknown): AppLoadContext {
  return {
    db,
    requestId: c.get("requestId"),
    functionCallId: c.get("functionCallId"),
    requestTime: new Date().toISOString(),
    url: c.req.url,
    ...c,
  };
}

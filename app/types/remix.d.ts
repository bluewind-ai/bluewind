// app/types/remix.d.ts

import type { DrizzleQuery } from "~/middleware";
import type { db } from "~/middleware/main";

declare module "@remix-run/node" {
  interface AppLoadContext {
    requestTime: string;
    url: string;
    db: typeof db;
    queries: DrizzleQuery[];
    requestId: number;
  }
}

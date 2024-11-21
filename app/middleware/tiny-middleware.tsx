// app/middleware/tiny-middleware.tsx

import { Context } from "hono";

export async function tinyMiddleware(c: Context, next: () => Promise<void>) {
  console.log("💥 Tiny middleware throwing error!");
  throw new Error("BOOM from tiny middleware!");
}

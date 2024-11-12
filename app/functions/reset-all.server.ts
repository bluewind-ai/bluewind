// app/functions/reset-all.server.ts

import { execSync } from "child_process";
import { createAction } from "~/lib/action-builder.server";
export const resetAll = createAction("reset-all", async () => {
  execSync(
    "rm -rf build && rm -rf .drizzle && rm -rf .drizzle-kit && rm -rf node_modules && rm -rf .eslintcache && rm -rf .prettiercache",
    { stdio: "inherit" },
  );

  execSync("npm install", { stdio: "inherit" });

  execSync("sh reset-db.sh", { stdio: "inherit" });

  execSync("npm run fix", { stdio: "inherit" });

  return {
    success: true,
    message: "Reset completed successfully",
  };
}

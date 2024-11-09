// app/actions/reset-all.server.ts

import { execSync } from "child_process";

export async function resetAll() {
  // Clean everything
  execSync(
    "rm -rf build && rm -rf .drizzle && rm -rf .drizzle-kit && rm -rf node_modules && rm -rf .eslintcache && rm -rf .prettiercache",
    { stdio: "inherit" },
  );

  // Reinstall dependencies
  execSync("npm install", { stdio: "inherit" });

  // Reset DB
  execSync("sh reset-db.sh", { stdio: "inherit" });

  // Run fix
  execSync("npm run fix", { stdio: "inherit" });

  return {
    success: true,
    message: "Reset completed successfully",
  };
}

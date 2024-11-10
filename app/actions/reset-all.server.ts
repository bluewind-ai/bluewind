// app/actions/reset-all.server.ts

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function resetAll() {
  // Clean everything
  await execAsync(
    "rm -rf build && rm -rf .drizzle && rm -rf .drizzle-kit && rm -rf node_modules && rm -rf .eslintcache && rm -rf .prettiercache",
  );

  // Reinstall dependencies
  await execAsync("npm install");

  // Reset DB
  await execAsync("sh reset-db.sh");

  // Run fix
  await execAsync("npm run fix");

  return {
    success: true,
    message: "Reset completed successfully",
  };
}

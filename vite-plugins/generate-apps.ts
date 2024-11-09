// vite-plugins/generate-apps.ts

import { Plugin } from "vite";
import { executeGenerateApps } from "../app/actions/executeGenerateApps.server";
import type { HmrContext } from "vite";
import path from "path";

export function appsPlugin(): Plugin {
  return {
    name: "apps",
    async configureServer(server) {
      console.log("🔌 Apps plugin initialized");
      // Initial generation
      await executeGenerateApps().catch(console.error);

      // Watch for route changes
      server.watcher.on("change", async (filePath) => {
        if (filePath.includes(path.join("app", "routes"))) {
          console.log("📁 Detected route change:", filePath);
          await executeGenerateApps().catch(console.error);
        }
      });
    },

    async handleHotUpdate(ctx: HmrContext) {
      if (ctx.file.includes(path.join("app", "routes"))) {
        console.log("🔥 Hot update in routes:", ctx.file);
        await executeGenerateApps().catch(console.error);
      }
      return ctx.modules;
    },
  };
}

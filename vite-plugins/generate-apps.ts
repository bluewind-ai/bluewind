// vite-plugins/generate-apps.ts

import { Plugin } from "vite";
import { executeGenerateApps } from "../app/actions/executeGenerateApps.server";
import path from "path";

export function appsPlugin(): Plugin {
  console.log("🎯 Apps plugin being registered"); // This should show up when Vite loads plugins

  return {
    name: "apps",
    buildStart() {
      console.log("🏗️ Apps plugin build starting");
    },
    async configureServer(server) {
      console.log("🚀 Apps plugin server configuration starting");
      console.log("🔌 Server instance received:", !!server);

      // Watch for route changes
      server.watcher.on("change", async (filePath) => {
        console.log("👀 Watcher detected change:", filePath);
        if (filePath.includes(path.join("app", "routes"))) {
          console.log("📁 Route change detected:", filePath);
          await executeGenerateApps().catch((err) => {
            console.error("❌ Execute apps error:", err);
          });
        }
      });

      // Initial generation
      try {
        await executeGenerateApps();
        console.log("✅ Initial apps generation complete");
      } catch (error) {
        console.error("❌ Initial apps generation failed:", error);
      }
    },
  };
}

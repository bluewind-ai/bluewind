// vite-plugins/generate-apps.ts

import { Plugin } from "vite";
import path from "path";
import { executeGenerateApps } from "../app/actions/executeGenerateApps.server";
// Change any other ~ imports to relative paths

export function appsPlugin(): Plugin {
  console.log("🎯 Apps plugin being registered");

  return {
    name: "apps",
    buildStart() {
      console.log("🏗️ Apps plugin build starting");
    },
    async configureServer(server) {
      console.log("🚀 Apps plugin server configuration starting");
      console.log("🔌 Server instance received:", !!server);

      server.watcher.on("change", async (filePath) => {
        console.log("👀 Watcher detected change:", filePath);
        if (filePath.includes(path.join("app", "routes"))) {
          console.log("📁 Route change detected:", filePath);
          try {
            await executeGenerateApps();
            console.log("✅ Apps generation complete after route change");
          } catch (err) {
            console.error("❌ Execute apps error:", err);
          }
        }
      });

      try {
        await executeGenerateApps();
        console.log("✅ Initial apps generation complete");
      } catch (error) {
        console.error("❌ Initial apps generation failed:", error);
      }
    },
  };
}

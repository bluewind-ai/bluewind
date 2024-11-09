// vite-plugins/generate-apps.ts

import { Plugin } from "vite";
import { executeGenerateApps } from "~/actions/executeGenerateApps.server";

export function appsPlugin(): Plugin {
  return {
    name: "apps",
    async configureServer() {
      console.log("🔌 Apps plugin initialized");
      try {
        console.log("🏃 Starting apps generation process");
        await executeGenerateApps();
        console.log("✅ Apps generation complete");
      } catch (error) {
        console.error("❌ Error in apps plugin:", error);
      }
    },
  };
}

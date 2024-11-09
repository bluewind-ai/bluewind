// vite-plugins/generate-apps.ts

import { Plugin } from "vite";
import { executeGenerateApps } from "../app/actions/executeGenerateApps.server";

export function appsPlugin(): Plugin {
  return {
    name: "apps",
    async configureServer() {
      console.log("==========================================");
      console.log("🔌 Apps plugin initialized");
      try {
        console.log("🏃 Starting apps generation process via plugin");
        const result = await executeGenerateApps();
        console.log("✅ Apps generation complete - result:", result);
      } catch (error) {
        console.error("❌ Error in apps plugin:", error);
        // Log the full error stack for debugging
        if (error instanceof Error) {
          console.error("Stack trace:", error.stack);
        }
      }
      console.log("==========================================");
    },
  };
}

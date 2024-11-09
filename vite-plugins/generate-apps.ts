// vite-plugins/generate-apps.ts

import { Plugin } from "vite";
import { generateApps } from "~/actions/generate-apps.server";

export function appsPlugin(): Plugin {
  return {
    name: "apps",
    async configureServer() {
      try {
        await generateApps();
        console.log("✅ Apps generated");
      } catch (error) {
        console.error("❌ Error generating apps:", error);
      }
    },
  };
}

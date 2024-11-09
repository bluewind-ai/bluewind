// vite-plugins/generate-apps.ts

import { Plugin } from "vite";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

async function generateAppsFile() {
  console.log("🎯 Starting apps file generation");

  // For now, just hardcode the back-office app
  const appsData = [
    {
      id: 1,
      value: "back-office",
      name: "Back Office",
      iconKey: "settings",
      order: 1,
    },
  ];

  // Generate the apps file content
  const fileContent = `
// THIS FILE IS AUTO-GENERATED - DO NOT EDIT
export const apps = ${JSON.stringify(appsData, null, 2)} as const;
`;

  // Ensure the generated directory exists
  const generatedDir = path.join(process.cwd(), "app", "lib", "generated");
  if (!existsSync(generatedDir)) {
    await fs.mkdir(generatedDir, { recursive: true });
  }

  // Write the file
  await fs.writeFile(path.join(generatedDir, "apps.ts"), fileContent, "utf-8");
  console.log("✨ Apps file generated successfully");
}

export function appsPlugin(): Plugin {
  return {
    name: "apps",
    async configureServer(server) {
      console.log("🔌 Apps plugin initialized");

      server.watcher.on("change", async (filePath) => {
        if (filePath.includes(path.join("app", "routes"))) {
          console.log("📁 Route change detected:", filePath);
          try {
            await generateAppsFile();
          } catch (err) {
            console.error("❌ Apps generation error:", err);
          }
        }
      });

      // Listen for HMR completion
      server.ws.on("confirmation", () => {
        console.log("🔄 HMR update completed");
      });

      // Initial generation
      try {
        await generateAppsFile();
      } catch (error) {
        console.error("❌ Initial apps generation failed:", error);
      }
    },
  };
}

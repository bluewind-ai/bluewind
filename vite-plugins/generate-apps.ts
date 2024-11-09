// vite-plugins/generate-apps.ts

import { Plugin } from "vite";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

async function generateAppsFile() {
  console.log("🎯 Starting apps file generation");

  const appsData = [
    {
      id: 1,
      value: "back-office",
      name: "Back Office",
      iconKey: "settings",
      order: 1,
    }
  ];

  const fileContent = `
// THIS FILE IS AUTO-GENERATED - DO NOT EDIT
export const apps = ${JSON.stringify(appsData, null, 2)} as const;
`;

  const generatedDir = path.join(process.cwd(), "app", "lib", "generated");
  if (!existsSync(generatedDir)) {
    await fs.mkdir(generatedDir, { recursive: true });
  }

  await fs.writeFile(path.join(generatedDir, "apps.ts"), fileContent, "utf-8");
  console.log("✨ Apps file generated successfully");
}

let pendingGeneration: Promise<void> | null = null;

export function appsPlugin(): Plugin {
  return {
    name: "apps",
    async configureServer(server) {
      console.log("🔌 Apps plugin initialized");

      server.watcher.on("change", async (filePath) => {
        if (filePath.includes("generated/apps.ts")) {
          console.log("⏭️ Ignoring generated file change");
          return;
        }

        if (!filePath.includes(path.join("app", "routes"))) {
          return;
        }

        // If there's a pending generation, wait for it
        if (pendingGeneration) {
          console.log("⏳ Waiting for pending generation to complete");
          await pendingGeneration;
        }

        console.log("📁 Processing change:", filePath);
        pendingGeneration = generateAppsFile();

        try {
          await pendingGeneration;
        } catch (err) {
          console.error("❌ Apps generation error:", err);
        } finally {
          pendingGeneration = null;
        }
      });

      // Initial generation
      try {
        await generateAppsFile();
      } catch (error) {
        console.error("❌ Initial apps generation failed:", error);
      }
    }
  };
}
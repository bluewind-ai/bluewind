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
    },
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

let isGenerating = false;
let queuedGeneration = false;
let timeoutId: NodeJS.Timeout | null = null;

async function queueGeneration(filePath: string) {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  return new Promise<void>((resolve) => {
    timeoutId = setTimeout(async () => {
      if (isGenerating) {
        queuedGeneration = true;
        return resolve();
      }

      isGenerating = true;
      console.log("📁 Processing change:", filePath);

      try {
        await generateAppsFile();
      } finally {
        isGenerating = false;
        if (queuedGeneration) {
          queuedGeneration = false;
          await queueGeneration(filePath);
        }
      }
      resolve();
    }, 300); // Increased delay
  });
}

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

        await queueGeneration(filePath);
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

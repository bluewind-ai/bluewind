// vite-plugins/generate-apps.ts

import { Plugin } from "vite";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

async function generateAppsFile() {
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

  const filePath = path.join(generatedDir, "apps.ts");

  try {
    const existingContent = await fs.readFile(filePath, 'utf-8');
    if (existingContent.trim() === fileContent.trim()) {
      return; // File is identical, do nothing
    }
  } catch {
    // File doesn't exist, continue
  }

  await fs.writeFile(filePath, fileContent, "utf-8");
  console.log("✨ Apps file updated");
}

async function loadAppsToDb() {
  try {
    console.log("📡 Calling load-apps endpoint...");
    const response = await fetch('http://localhost:3000/api/load-apps', {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to load apps: ${response.statusText}`);
    }
    console.log("📦 Apps loaded to database");
  } catch (error) {
    console.error("❌ Failed to trigger apps load:", error);
  }
}

export function appsPlugin(): Plugin {
  return {
    name: "apps",
    async configureServer(server) {
      console.log("🔌 Apps plugin initialized");

      // Debug all events
      server.ws.on("connection", () => console.log("🔌 WS Connected"));
      server.ws.on("close", () => console.log("🔌 WS Closed"));

      // Log all events
      server.ws.on("*", async (event, data) => {
        console.log("📡 WS Event:", event, data);
      });

      // Try different reload events
      server.middlewares.on("upgrade", () => {
        console.log("🔄 Middleware Upgrade");
      });

      server.watcher.on("ready", () => {
        console.log("👀 Watcher Ready");
      });

      server.watcher.on("change", async (filePath) => {
        console.log("📄 File Changed:", filePath);

        if (filePath.includes("generated/apps.ts")) {
          console.log("⏭️ Ignoring generated file change");
          return;
        }

        if (!filePath.includes(path.join("app", "routes"))) {
          return;
        }

        try {
          await generateAppsFile();
          console.log("🔄 Triggering load after file generation");
          await loadAppsToDb();
        } catch (err) {
          console.error("❌ Apps generation error:", err);
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
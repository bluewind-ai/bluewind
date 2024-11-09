// vite-plugins/generate-apps.ts

import { Plugin } from "vite";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { db } from "../app/db";
import { actionCalls, apps } from "../app/db/schema";

async function generateApps() {
  console.log("🎯 Starting apps file generation");

  // Fetch apps data from database
  const appsData = await db.query.apps.findMany({
    orderBy: (apps, { asc }) => [asc(apps.order)],
  });

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

  // Create an action call record
  const thisAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "generate-apps"),
  });

  if (!thisAction) throw new Error("generate-apps not found in database");

  const [actionCall] = await db
    .insert(actionCalls)
    .values({
      actionId: thisAction.id,
      status: "completed",
      result: {
        success: true,
        appsCount: appsData.length,
      },
    })
    .returning();

  console.log("✨ Apps file generated successfully");
  return actionCall;
}

async function loadAppsToDB() {
  console.log("📥 Starting to load apps to database");

  const appsPath = path.join(process.cwd(), "app", "lib", "generated", "apps.ts");

  try {
    await fs.access(appsPath);
  } catch (error) {
    console.log("📝 No apps file found, skipping load to DB");
    return null;
  }

  // Dynamic import with full path to avoid TypeScript error
  const { apps: generatedApps } = await import(appsPath);

  console.log(`💾 Upserting ${generatedApps.length} apps to database`);
  for (const app of generatedApps) {
    await db
      .insert(apps)
      .values({
        value: app.value,
        label: app.name,
        iconKey: app.iconKey,
        order: app.id,
      })
      .onConflictDoUpdate({
        target: [apps.value],
        set: {
          label: app.name,
          iconKey: app.iconKey,
          order: app.id,
        },
      });
  }

  const thisAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "load-apps-to-db"),
  });

  if (!thisAction) throw new Error("load-apps-to-db not found in database");

  const [actionCall] = await db
    .insert(actionCalls)
    .values({
      actionId: thisAction.id,
      status: "completed",
      result: {
        success: true,
        appsCount: generatedApps.length,
      },
    })
    .returning();

  console.log("✅ Apps loaded to database successfully");
  return actionCall;
}

async function executeGenerateApps() {
  console.log("🚀 Starting complete apps generation process");

  const generateResult = await generateApps();
  console.log("✓ Apps file generated");

  const loadResult = await loadAppsToDB();
  console.log("✓ Apps loaded to database");

  // Create an action call record for the full process
  const thisAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "execute-generate-apps"),
  });

  if (!thisAction) throw new Error("execute-generate-apps not found in database");

  const [actionCall] = await db
    .insert(actionCalls)
    .values({
      actionId: thisAction.id,
      status: "completed",
      result: {
        success: true,
        generateResult,
        loadResult,
      },
    })
    .returning();

  console.log("✨ Complete apps generation process finished");
  return actionCall;
}

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

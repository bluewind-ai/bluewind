// app/routes/api.load-files.ts

import { json } from "@remix-run/node";
import { db } from "~/db";
import { apps, actions, actionCalls } from "~/db/schema";
import fs from "node:fs/promises";
import path from "node:path";

const APPS_DATA = [
  {
    id: 1,
    value: "back-office",
    name: "Back Office",
    iconKey: "settings",
    order: 1,
  },
];

async function generateAppsFile() {
  console.log("\n=== 📝 Generating Apps File ===");
  const fileContent = `
// THIS FILE IS AUTO-GENERATED - DO NOT EDIT
export const apps = ${JSON.stringify(APPS_DATA, null, 2)} as const;
`;

  const generatedDir = path.join(process.cwd(), "app", "lib", "generated");
  await fs.mkdir(generatedDir, { recursive: true });

  const filePath = path.join(generatedDir, "apps.ts");
  await fs.writeFile(filePath, fileContent, "utf-8");
  console.log("✨ Apps file generated");
}

async function generateActionsFile() {
  console.log("\n=== 📝 Generating Actions File ===");
  const actionsDir = path.join(process.cwd(), "app", "actions");
  const files = await fs.readdir(actionsDir);
  const actionFiles = files.filter((file) => file.endsWith(".server.ts"));

  const content = `// app/lib/generated/actions.ts
// This file is auto-generated. Do not edit it manually.

${actionFiles
  .map((file) => {
    const basename = path.basename(file, ".server.ts");
    const camelName = kebabToCamel(basename);
    return `import { ${camelName} } from "~/actions/${basename}.server";`;
  })
  .join("\n")}

export const actions = {
  ${actionFiles
    .map((file) => {
      const basename = path.basename(file, ".server.ts");
      const camelName = kebabToCamel(basename);
      return `"${basename}": ${camelName}`;
    })
    .join(",\n  ")}
} as const;`;

  await fs.mkdir("app/lib/generated", { recursive: true });
  await fs.writeFile("app/lib/generated/actions.ts", content);
  console.log("✨ Actions file generated");
}

function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

async function syncApps() {
  console.log("\n=== 📥 Load Apps to DB Started ===");
  console.log(`Found ${APPS_DATA.length} apps to process`);

  try {
    console.log("💾 Upserting apps to database...");
    for (const app of APPS_DATA) {
      console.log(`  • Processing ${app.name}`);
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

    // First try to find the action
    let thisAction = await db.query.actions.findFirst({
      where: (fields, { eq }) => eq(fields.name, "load-apps-to-db"),
    });

    // If not found, create it
    if (!thisAction) {
      console.log("Creating load-apps-to-db action...");
      const [newAction] = await db
        .insert(actions)
        .values({
          name: "load-apps-to-db",
          type: "action",
        })
        .returning();
      thisAction = newAction;
    }

    const [actionCall] = await db
      .insert(actionCalls)
      .values({
        actionId: thisAction.id,
        status: "completed",
        result: {
          success: true,
          appsCount: APPS_DATA.length,
        },
      })
      .returning();

    console.log("✅ All apps successfully loaded to database");
    console.log("=== 💫 Load Apps to DB Complete ===\n");
    return actionCall;
  } catch (error) {
    console.error("❌ Failed to load apps:", error);
    console.log("=== 💥 Load Apps to DB Failed ===\n");
    throw error;
  }
}

async function syncActions() {
  const actionsDir = path.join(process.cwd(), "app", "actions");
  console.log("Looking for actions in:", actionsDir);

  const files = await fs.readdir(actionsDir);
  console.log("Found files:", files);

  const actionFiles = files.filter((file) => file.endsWith(".server.ts"));
  console.log("Filtered server files:", actionFiles);

  const actionNames = actionFiles.map((file) => path.basename(file, ".server.ts"));
  console.log("Action names:", actionNames);

  const results = [];

  for (const name of actionNames) {
    const existing = await db.query.actions.findFirst({
      where: (fields, { eq }) => eq(fields.name, name),
    });

    if (!existing) {
      await db
        .insert(actions)
        .values({
          name,
          type: "action",
        })
        .returning();
      results.push({ name, status: "created" });
    } else {
      results.push({ name, status: "exists" });
    }
  }

  // First try to find the action
  let thisAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "load-actions"),
  });

  // If not found, create it
  if (!thisAction) {
    console.log("Creating load-actions action...");
    const [newAction] = await db
      .insert(actions)
      .values({
        name: "load-actions",
        type: "action",
      })
      .returning();
    thisAction = newAction;
  }

  const [actionCall] = await db
    .insert(actionCalls)
    .values({
      actionId: thisAction.id,
      status: "completed",
      result: {
        success: true,
        actionsFound: actionNames,
        results,
      },
    })
    .returning();

  return actionCall;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function loader() {
  try {
    console.log("\n=== 🔄 Starting System Sync ===");

    console.log("\n--- 📝 Generating Files ---");
    await Promise.all([
      generateAppsFile(),
      generateActionsFile()
    ]);
    console.log("✅ Files generated");

    console.log("\n⏳ Waiting 1 second for filesystem...");
    await sleep(1000);

    console.log("\n--- 📱 Syncing Apps ---");
    const appsResult = await syncApps();
    console.log("✅ Apps sync completed");

    console.log("\n--- 🔧 Syncing Actions ---");
    const actionsResult = await syncActions();
    console.log("✅ Actions sync completed");

    console.log("\n=== ✨ System Sync Complete ===\n");

    return json({
      success: true,
      apps: appsResult,
      actions: actionsResult
    });
  } catch (error) {
    console.error("\n❌ Sync failed:", error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
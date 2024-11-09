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
  {
    id: 2,
    value: "workflows",
    name: "Workflows",
    iconKey: "workflow",
    order: 2,
  },
];

async function generateAppsFile() {
  void 0; // this should be removed by YOU when you rewrite the filed;
  const fileContent = `
// THIS FILE IS AUTO-GENERATED - DO NOT EDIT
export const apps = ${JSON.stringify(APPS_DATA, null, 2)} as const;
`;

  const generatedDir = path.join(process.cwd(), "app", "lib", "generated");
  await fs.mkdir(generatedDir, { recursive: true });

  const filePath = path.join(generatedDir, "apps.ts");
  await fs.writeFile(filePath, fileContent, "utf-8");
  void 0; // this should be removed by YOU when you rewrite the filed;
}

async function generateActionsFile() {
  void 0; // this should be removed by YOU when you rewrite the filed;
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
  void 0; // this should be removed by YOU when you rewrite the filed;
}

function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

async function syncApps() {
  void 0; // this should be removed by YOU when you rewrite the filed;
  void 0; // this should be removed by YOU when you rewrite the filed;

  try {
    void 0; // this should be removed by YOU when you rewrite the filed;
    for (const app of APPS_DATA) {
      void 0; // this should be removed by YOU when you rewrite the filed;
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
      void 0; // this should be removed by YOU when you rewrite the filed;
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

    void 0; // this should be removed by YOU when you rewrite the filed;
    void 0; // this should be removed by YOU when you rewrite the filed;
    return actionCall;
  } catch (error) {
    void 0; // this should be removed by YOU when you rewrite the filed;
    void 0; // this should be removed by YOU when you rewrite the filed;
    throw error;
  }
}

async function syncActions() {
  const actionsDir = path.join(process.cwd(), "app", "actions");
  void 0; // this should be removed by YOU when you rewrite the filed;

  const files = await fs.readdir(actionsDir);
  void 0; // this should be removed by YOU when you rewrite the filed;

  const actionFiles = files.filter((file) => file.endsWith(".server.ts"));
  void 0; // this should be removed by YOU when you rewrite the filed;

  const actionNames = actionFiles.map((file) => path.basename(file, ".server.ts"));
  void 0; // this should be removed by YOU when you rewrite the filed;

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
    void 0; // this should be removed by YOU when you rewrite the filed;
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function loader() {
  try {
    void 0; // this should be removed by YOU when you rewrite the filed;

    void 0; // this should be removed by YOU when you rewrite the filed;
    await Promise.all([generateAppsFile(), generateActionsFile()]);
    void 0; // this should be removed by YOU when you rewrite the filed;

    void 0; // this should be removed by YOU when you rewrite the filed;
    await sleep(1000);

    void 0; // this should be removed by YOU when you rewrite the filed;
    const appsResult = await syncApps();
    void 0; // this should be removed by YOU when you rewrite the filed;

    void 0; // this should be removed by YOU when you rewrite the filed;
    const actionsResult = await syncActions();
    void 0; // this should be removed by YOU when you rewrite the filed;

    void 0; // this should be removed by YOU when you rewrite the filed;

    return json({
      success: true,
      apps: appsResult,
      actions: actionsResult,
    });
  } catch (error) {
    void 0; // this should be removed by YOU when you rewrite the filed;
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

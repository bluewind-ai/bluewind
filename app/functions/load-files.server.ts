// app/functions/load-files.server.ts

import { db } from "~/db";
import { apps, actions, functionCalls, ActionType, FunctionCallStatus } from "~/db/schema";
import fs from "node:fs/promises";
import path from "node:path";

type LoadResult = {
  name: string;
  status: string;
};

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
    value: "agents",
    name: "Agents",
    iconKey: "workflow",
    order: 2,
  },
];

async function generateAppsFile() {
  const fileContent = `
// THIS FILE IS AUTO-GENERATED - DO NOT EDIT
export const apps = ${JSON.stringify(APPS_DATA, null, 2)} as const;
`;

  const generatedDir = path.join(process.cwd(), "app", "lib", "generated");
  await fs.mkdir(generatedDir, { recursive: true });

  const filePath = path.join(generatedDir, "apps.ts");
  await fs.writeFile(filePath, fileContent, "utf-8");
}

async function generateActionsFile() {
  const functionsDir = path.join(process.cwd(), "app", "functions");
  const files = await fs.readdir(functionsDir);
  const actionFiles = files.filter((file) => file.endsWith(".server.ts"));

  const content = `// app/lib/generated/actions.ts
// This file is auto-generated. Do not edit it manually.

${actionFiles
  .map((file) => {
    const basename = path.basename(file, ".server.ts");
    const camelName = kebabToCamel(basename);
    return `import { ${camelName} } from "~/functions/${basename}.server";`;
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
}

function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

async function syncApps() {
  for (const app of APPS_DATA) {
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

  let thisAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "load-apps-to-db"),
  });

  if (!thisAction) {
    const [newAction] = await db
      .insert(actions)
      .values({
        name: "load-apps-to-db",
        type: ActionType.SYSTEM,
      })
      .returning();
    thisAction = newAction;
  }

  const [functionCall] = await db
    .insert(functionCalls)
    .values({
      actionId: thisAction.id,
      status: FunctionCallStatus.COMPLETED,
      result: {
        success: true,
        appsCount: APPS_DATA.length,
      },
    })
    .returning();

  return functionCall;
}

async function syncActions() {
  const functionsDir = path.join(process.cwd(), "app", "functions");
  const files = await fs.readdir(functionsDir);
  const actionFiles = files.filter((file) => file.endsWith(".server.ts"));
  const actionNames = actionFiles.map((file) => path.basename(file, ".server.ts"));

  const results: LoadResult[] = [];

  for (const name of actionNames) {
    const existing = await db.query.actions.findFirst({
      where: (fields, { eq }) => eq(fields.name, name),
    });

    if (!existing) {
      await db
        .insert(actions)
        .values({
          name,
          type: ActionType.SYSTEM,
        })
        .returning();
      results.push({ name, status: "created" });
    } else {
      results.push({ name, status: "exists" });
    }
  }

  let thisAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, "load-actions"),
  });

  if (!thisAction) {
    const [newAction] = await db
      .insert(actions)
      .values({
        name: "load-actions",
        type: ActionType.SYSTEM,
      })
      .returning();
    thisAction = newAction;
  }

  const [functionCall] = await db
    .insert(functionCalls)
    .values({
      actionId: thisAction.id,
      status: FunctionCallStatus.COMPLETED,
      result: {
        success: true,
        actionsFound: actionNames,
        results,
      },
    })
    .returning();

  return functionCall;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function loadFiles() {
  await Promise.all([generateAppsFile(), generateActionsFile()]);
  await sleep(1000);

  const appsResult = await syncApps();
  const actionsResult = await syncActions();

  return {
    success: true,
    apps: appsResult,
    actions: actionsResult,
  };
}

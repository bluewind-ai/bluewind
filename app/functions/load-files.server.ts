// app/functions/load-files.server.ts

import fs from "node:fs/promises";
import path from "node:path";

import type { LoaderFunctionArgs } from "@remix-run/node";
import { eq } from "drizzle-orm";

import { apps, functionCalls, FunctionCallStatus, serverFunctions } from "~/db/schema";
import { contextStore, createAction } from "~/lib/action-builder.server";
import { db } from "~/middleware";

import { createSystemAction } from "./create-system-action.server";

type LoadResult = {
  name: string;
  status: string;
  actionId?: number;
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

async function syncApps(args: LoaderFunctionArgs) {
  const store = contextStore.getStore();
  console.log("Syncing apps with store:", store);
  for (const app of APPS_DATA) {
    await args.context.db
      .insert(apps)
      .values({
        functionCallId: 1,
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
      })
      .returning();
  }
  let thisAction = await args.context.db.query.serverFunctions.findFirst({
    where: () => eq(serverFunctions.name, "load-apps-to-db"),
  });
  if (!thisAction) {
    const { action } = await createSystemAction(args, "load-apps-to-db");
    thisAction = action;
  }
  const request = await args.context.db.query.requests.findFirst();
  const [functionCall] = await args.context.db
    .insert(functionCalls)
    .values({
      requestId: request!.id,
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

async function syncActions(args: LoaderFunctionArgs) {
  const store = contextStore.getStore();
  console.log("Syncing actions with store:", store);
  const functionsDir = path.join(process.cwd(), "app", "functions");
  const files = await fs.readdir(functionsDir);
  const actionFiles = files.filter((file) => file.endsWith(".server.ts"));
  const actionNames = actionFiles.map((file) => path.basename(file, ".server.ts"));
  const results: LoadResult[] = [];
  for (const name of actionNames) {
    const existing = await args.context.db.query.serverFunctions.findFirst({
      where: () => eq(serverFunctions.name, name),
    });
    if (!existing) {
      const { action } = await createSystemAction(args, name);
      results.push({ name, status: "created", actionId: action.id });
    } else {
      results.push({ name, status: "exists" });
    }
  }
  let thisAction = await args.context.db.query.serverFunctions.findFirst({
    where: () => eq(serverFunctions.name, "load-actions"),
  });
  if (!thisAction) {
    const { action } = await createSystemAction(args, "load-actions");
    thisAction = action;
  }
  const request = await args.context.db.query.requests.findFirst();
  const [functionCall] = await args.context.db
    .insert(functionCalls)
    .values({
      requestId: request!.id,
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

export const loadFiles = createAction("load-files", async () => {
  const store = contextStore.getStore();
  console.log("Starting loadFiles with store:", store);
  await Promise.all([generateAppsFile(), generateActionsFile()]);
  await sleep(1000);
  const args = {
    context: {
      db,
      queries: [],
      sayHello: () => "hello",
    },
    request: new Request("http://localhost"),
    params: {},
  } as LoaderFunctionArgs;
  const appsResult = await syncApps(args);
  const actionsResult = await syncActions(args);
  return {
    success: true,
    apps: appsResult,
    actions: actionsResult,
  };
});

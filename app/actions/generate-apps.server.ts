// app/actions/generate-apps.server.ts

import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import fs from "fs/promises";
import path from "path";

export async function generateApps() {
  console.log("🔍 Scanning routes folder for apps");
  const routesPath = path.join(process.cwd(), "app", "routes");
  const entries = await fs.readdir(routesPath);

  const apps = [];
  let id = 1;

  for (const entry of entries) {
    if (entry.includes("+")) {
      console.log(`📁 Found app: ${entry}`);
      const value = entry.replace("+", "");
      const name = value
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      let iconKey;
      switch (value) {
        case "objects":
          iconKey = "database";
          break;
        case "back-office":
          iconKey = "table";
          break;
        case "actions":
          iconKey = "actions";
          break;
        case "selectors":
          iconKey = "selectors";
          break;
        default:
          iconKey = "app";
      }

      apps.push({
        id: id++,
        name,
        value,
        type: "app",
        iconKey,
      });
    }
  }

  console.log("📝 Writing apps to generated file");
  const appsFileContent = `// This file is auto-generated. Do not edit it manually
export const apps = ${JSON.stringify(apps, null, 2)} as const;
`;

  const filePath = path.join(process.cwd(), "app", "lib", "generated", "apps.ts");
  await fs.writeFile(filePath, appsFileContent, "utf-8");

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
        apps,
        generatedFile: filePath,
      },
    })
    .returning();

  console.log("✅ Generated apps file successfully");
  return actionCall;
}

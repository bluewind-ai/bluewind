// app/routes/admin.remove-console.ts

import { json, type ActionFunctionArgs } from "@remix-run/node";
import fs from "fs/promises";
import path from "path";
import { glob } from "glob";

type ActionResponse =
  | {
      success: true;
      totalRemoved: number;
      modifiedFiles: number;
      modifiedFilePaths: string[];
      message: string;
    }
  | {
      success: false;
      error: string;
      stack?: string;
    };

export async function action({ request }: ActionFunctionArgs) {
  const appPath = path.join(process.cwd(), "app");
  const files = await glob("**/*.{ts,tsx}", { cwd: appPath });

  let totalRemoved = 0;
  let modifiedFiles = 0;
  let modifiedFilePaths: string[] = [];

  for (const file of files) {
    const filePath = path.join(appPath, file);
    const content = await fs.readFile(filePath, "utf-8");

    const newContent = content.replace(/\bconsole\.[^(]*\([^)]*\);?\n?/g, "");

    if (content !== newContent) {
      await fs.writeFile(filePath, newContent);
      const removedCalls = (content.match(/\bconsole\.[^(]*\([^)]*\);?\n?/g) || []).length;
      totalRemoved += removedCalls;
      modifiedFiles++;
      modifiedFilePaths.push(filePath);
    }
  }

  return json<ActionResponse>({
    success: true,
    totalRemoved,
    modifiedFiles,
    modifiedFilePaths,
    message: `Removed ${totalRemoved} console calls from ${modifiedFiles} files`,
  });
}

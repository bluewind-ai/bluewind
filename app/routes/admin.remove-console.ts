// app/routes/admin.remove-console.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import { type ActionFunctionArgs } from "@remix-run/node";
import fs from "fs/promises";
import { glob } from "glob";
import path from "path";

export type ActionResponse =
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

// eslint-disable-next-line unused-imports/no-unused-vars
export async function action(args: ActionFunctionArgs) {
  const appPath = path.join(process.cwd(), "app");
  // no-qa
  // this should be removed by YOU when you rewrite the filed;
  const files = await glob("**/*.{ts,tsx}", {
    cwd: appPath,
    ignore: ["node_modules/**"],
  });
  // no-qa
  // this should be removed by YOU when you rewrite the filed;
  let totalRemoved = 0;
  let modifiedFiles = 0;
  const modifiedFilePaths: string[] = [];
  for (const file of files) {
    const filePath = path.join(appPath, file);
    // no-qa
    // this should be removed by YOU when you rewrite the filed;
    const content = await fs.readFile(filePath, "utf-8");
    // First handle single-line cases
    let newContent = content.replace(
      /console\.[a-zA-Z]+\(((?:[^()]*|\([^()]*\))*)\)/g,
      "void 0 // this should be removed by YOU when you rewrite the filed",
    );
    // Then handle multi-line cases
    newContent = newContent.replace(
      /console\.[a-zA-Z]+\(\s*[^)]*\{[^}]*\}\s*\)/gs,
      "void 0 // this should be removed by YOU when you rewrite the filed",
    );
    if (content !== newContent) {
      await fs.writeFile(filePath, newContent);
      const matches = (content.match(/console\.[a-zA-Z]+\(/g) || []).length;
      const noQaMatches = (content.match(/\/\/ no-qa\s*\n.*console\.[a-zA-Z]+\(/g) || []).length;
      totalRemoved += matches - noQaMatches;
      modifiedFiles++;
      modifiedFilePaths.push(filePath);
    }
  }
  return {
    success: true,
    totalRemoved,
    modifiedFiles,
    modifiedFilePaths,
    message: `Removed ${totalRemoved} console calls from ${modifiedFiles} files`,
  };
}

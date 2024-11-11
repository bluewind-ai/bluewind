// app/routes/admin.remove-console.ts

/* eslint-disable @typescript-eslint/no-unused-vars */

import { json, type ActionFunctionArgs } from "@remix-run/node";
import fs from "fs/promises";
import path from "path";
import { glob } from "glob";

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

async function _action(_: ActionFunctionArgs) {
  const appPath = path.join(process.cwd(), "app");
  const files = await glob("**/*.{ts,tsx}", { cwd: appPath });

  let totalRemoved = 0;
  let modifiedFiles = 0;
  const modifiedFilePaths: string[] = [];

  for (const file of files) {
    const filePath = path.join(appPath, file);
    const content = await fs.readFile(filePath, "utf-8");

    const newContent = content.replace(
      /console\.[a-zA-Z]+\(((?:[^()]*|\([^()]*\))*)\)/g,
      "void 0 // this should be removed by YOU when you rewrite the filed",
    );

    if (content !== newContent) {
      await fs.writeFile(filePath, newContent);
      const matches = (content.match(/console\.[a-zA-Z]+\(/g) || []).length;
      totalRemoved += matches;
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

export async function action(args: ActionFunctionArgs) {
  await beforeAction(args);
  const response = await _action(args);
  await afterAction(args, response);
  return json(response);
}

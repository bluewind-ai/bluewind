// scripts/count-console.ts

import { Project, SyntaxKind, CallExpression } from "ts-morph";
import path from "path";

const project = new Project();
const appPath = path.join(process.cwd(), "app");
project.addSourceFilesAtPaths(path.join(appPath, "**/*.{ts,tsx}"));

const sourceFiles = project.getSourceFiles();
const consoleCallCount = sourceFiles.reduce((total: number, file) => {
  const calls = file.getDescendantsOfKind(SyntaxKind.CallExpression);
  const consoleCalls = calls.filter((call: CallExpression) =>
    call.getExpression().getText().startsWith("console."),
  );

  return total + consoleCalls.length;
}, 0);

console.log(`Found ${consoleCallCount} console calls`);

// scripts/count-console.ts

import { Project } from "ts-morph";
import path from "path";

const project = new Project();
const appPath = path.join(process.cwd(), "app");
project.addSourceFilesAtPaths(path.join(appPath, "**/*.{ts,tsx}"));

const sourceFiles = project.getSourceFiles();
let total = 0;
sourceFiles.forEach((file) => {
  const calls = file.getDescendantsOfKind(4);
  const consoleCalls = calls.filter((call) =>
    call.getExpression().getText().startsWith("console."),
  );
  if (consoleCalls.length > 0) {
    total += consoleCalls.length;
  }
});

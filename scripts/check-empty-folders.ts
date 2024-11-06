// scripts/check-empty-folders.ts

import { readdirSync, statSync } from "fs";
import { join } from "path";

const EXCLUDED_DIRS = ["node_modules", "dist", ".git", ".next", "build", "coverage"];

const findEmptyFolders = (dir: string): string[] => {
  const emptyFolders: string[] = [];

  const scan = (currentDir: string) => {
    const items = readdirSync(currentDir);

    // Skip excluded directories
    if (EXCLUDED_DIRS.some((excluded) => currentDir.includes(excluded))) {
      return;
    }

    if (items.length === 0) {
      emptyFolders.push(currentDir);
      return;
    }

    for (const item of items) {
      const fullPath = join(currentDir, item);
      if (statSync(fullPath).isDirectory()) {
        scan(fullPath);
      }
    }
  };

  scan(dir);
  return emptyFolders;
};

// Start scanning from project root
const emptyFolders = findEmptyFolders(".");

if (emptyFolders.length > 0) {
  console.error("Empty folders found:");
  emptyFolders.forEach((folder) => console.error(`- ${folder}`));
  process.exit(1);
} else {
  console.log("No empty folders found");
  process.exit(0);
}

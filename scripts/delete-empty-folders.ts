// scripts/delete-empty-folders.ts

import { readdirSync, statSync, rmdirSync } from "fs";
import { join } from "path";

const EXCLUDED_DIRS = ["node_modules", "dist", ".git", ".next", "build", "coverage"];

const findAndDeleteEmptyFolders = (dir: string): string[] => {
  const deletedFolders: string[] = [];

  const scan = (currentDir: string) => {
    const items = readdirSync(currentDir);

    if (EXCLUDED_DIRS.some((excluded) => currentDir.includes(excluded))) {
      return;
    }

    if (items.length === 0) {
      try {
        rmdirSync(currentDir);
        deletedFolders.push(currentDir);
      } catch (error) {
        console.error(`Failed to delete ${currentDir}:`, error);
      }
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
  return deletedFolders;
};

const deletedFolders = findAndDeleteEmptyFolders(".");

if (deletedFolders.length > 0) {
  console.error("\x1b[31m%s\x1b[0m", "Deleted empty folders:");
  deletedFolders.forEach((folder) => console.error("\x1b[31m-", folder, "\x1b[0m"));
  process.exit(0);
} else {
  console.log("No empty folders found");
  process.exit(0);
}

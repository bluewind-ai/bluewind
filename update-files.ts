// update-files.ts

import * as fs from "fs";
import * as path from "path";
import { simpleGit } from "simple-git";
import { execSync } from "child_process";

interface CodeSnippet {
  filepath: string;
  code: string;
}

const git = simpleGit();

async function hasUnstagedChanges(): Promise<boolean> {
  const status = await git.status();
  return !status.isClean();
}

function insertLineAtBeginning(filePath: string, lineToInsert: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  if (!content.startsWith(lineToInsert)) {
    const newContent = `${lineToInsert}\n${content}`;
    fs.writeFileSync(filePath, newContent);
  }
}

function extractFileSnippets(text: string): CodeSnippet[] {
  const pattern = /```(?:tsx?|typescript)\s*\n\/\/\s*([^\n]+)\s*\n([\s\S]+?)```/g;
  const snippets: CodeSnippet[] = [];

  let match;
  while ((match = pattern.exec(text)) !== null) {
    let filepath = match[1].trim();

    if (filepath.startsWith("src/app/")) {
      filepath = filepath.replace("src/app/", "app/");
    }
    if (filepath.includes("layout.tsx")) {
      filepath = filepath.replace("layout.tsx", "root.tsx");
    }

    const code = `// ${filepath}\n\n${match[2].trim()}`;
    snippets.push({ filepath, code });
  }

  return snippets;
}

async function writeFiles(snippets: CodeSnippet[], baseDir: string = "."): Promise<string[]> {
  const updatedFiles: string[] = [];

  for (const { filepath, code } of snippets) {
    const fullPath = path.join(baseDir, filepath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, code);
    updatedFiles.push(filepath);
  }

  return updatedFiles;
}

async function main(): Promise<void> {
  try {
    const hasChanges = await hasUnstagedChanges();
    if (hasChanges) {
      console.error("Error: You have unstaged changes. Please commit or stash them first.");
      process.exit(1);
    }

    const text = fs.readFileSync("claude-answer.txt", "utf-8");
    const snippets = extractFileSnippets(text);
    const updatedFiles = await writeFiles(snippets);
    insertLineAtBeginning("claude-answer.txt", "// claude-answer.txt");

    if (updatedFiles.length > 0) {
      // Run fix command
      try {
        execSync("npm run fix", { stdio: "pipe" });
      } catch (error) {
        console.log("Fix command completed with warnings - continuing");
      }

      // Force add and commit the files
      try {
        await git.add([...updatedFiles, "claude-answer.txt"]);
        await git.commit("checkpoint");
        console.log("Files updated and changes committed successfully");
      } catch (commitError) {
        console.error("Failed to commit:", commitError);
        process.exit(1);
      }
    } else {
      console.log("No files were updated");
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();

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
  const pattern = /
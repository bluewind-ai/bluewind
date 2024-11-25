// app/functions/update-files.server.ts
import * as fs from "fs";
import * as path from "path";

import type { ExtendedContext } from "~/middleware";

interface CodeSnippet {
  filepath: string;
  code: string;
}
function insertLineAtBeginning(filePath: string, lineToInsert: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  if (!content.startsWith(lineToInsert)) {
    const newContent = `${lineToInsert}\n${content}`;
    fs.writeFileSync(filePath, newContent);
  }
}
function extractFileSnippets(text: string): CodeSnippet[] {
  const pattern = new RegExp(
    "```(?:tsx?|typescript|javascript|js)\\s*\\n\\/\\/\\s*([^\\n]+)\\s*\\n([\\s\\S]+?)```",
    "g",
  );
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
    const code =
      filepath.endsWith(".js") || filepath.endsWith(".cjs")
        ? match[2].trim()
        : `// ${filepath}\n\n${match[2].trim()}`;
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
export async function updateFiles(_request: ExtendedContext) {
  const text = fs.readFileSync("claude-answer.txt", "utf-8");
  const snippets = extractFileSnippets(text);
  await writeFiles(snippets);
  insertLineAtBeginning("claude-answer.txt", "// claude-answer.txt");
}

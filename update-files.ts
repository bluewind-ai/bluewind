// update-files.ts
import * as fs from "fs";
import * as path from "path";

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
  // Updated pattern to handle Remix file paths
  const pattern = /```(?:tsx?|typescript)\s*\n\/\/\s*([^\n]+)\s*\n([\s\S]+?)```/g;
  const snippets: CodeSnippet[] = [];

  let match;
  while ((match = pattern.exec(text)) !== null) {
    let filepath = match[1].trim();

    // Convert Next.js paths to Remix paths
    if (filepath.startsWith("src/app/")) {
      filepath = filepath.replace("src/app/", "app/");
    }
    if (filepath.includes("layout.tsx")) {
      filepath = filepath.replace("layout.tsx", "root.tsx");
    }

    const code = `// ${filepath}\n\n${match[2].trim()}`;
    snippets.push({ filepath, code });
    console.log(`Found snippet for file: ${filepath}`);
    console.log(`Code length: ${code.length} characters`);
  }

  return snippets;
}

function writeFiles(snippets: CodeSnippet[], baseDir: string = "."): void {
  for (const { filepath, code } of snippets) {
    const fullPath = path.join(baseDir, filepath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, code);
    console.log(`Written: ${filepath}`);
  }
}

function main(): void {
  const text = fs.readFileSync("claude-answer.txt", "utf-8");
  console.log("Read input file, content length:", text.length);

  const snippets = extractFileSnippets(text);

  console.log("\nFound the following files to update:");
  snippets.forEach(({ filepath }) => {
    console.log(`- ${filepath}`);
  });

  console.log("\nProceeding with file updates...");
  writeFiles(snippets);
  insertLineAtBeginning("claude-answer.txt", "// claude-answer.txt");
  console.log("\nAll files updated successfully!");
}

main();

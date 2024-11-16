// scripts/remove-console.ts

import fs from "node:fs";
import path from "node:path";

import * as ts from "typescript";

// no-qa
console.log("Starting console removal...");

const appPath = path.join(process.cwd(), "app");

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      if (!["node_modules", "build", "dist"].includes(file)) {
        arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
      }
    } else {
      if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });

  return arrayOfFiles;
}

function isConsoleCall(node: ts.Node): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) return false;

  const expression = node.expression;
  if (!ts.isPropertyAccessExpression(expression)) return false;

  const object = expression.expression;
  return ts.isIdentifier(object) && object.text === "console";
}

function hasNoQaComment(node: ts.Node, sourceFile: ts.SourceFile): boolean {
  const lineStart = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line;
  if (lineStart <= 0) return false;

  const prevLine = sourceFile.text.split("\n")[lineStart - 1];
  return prevLine.trim().includes("// eslint-disable-next-line");
}

function transformer(sourceFile: ts.SourceFile): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      if (
        ts.isExpressionStatement(node) &&
        isConsoleCall(node.expression) &&
        !hasNoQaComment(node, sourceFile)
      ) {
        return undefined; // This removes the node entirely
      }
      return ts.visitEachChild(node, visit, context);
    };

    return (node) => ts.visitNode(node, visit) as ts.SourceFile;
  };
}

const files = getAllFiles(appPath);
// no-qa
console.log(`Found ${files.length} files to process`);

let modifiedFiles = 0;
const modifiedFilePaths: string[] = [];

files.forEach((filePath) => {
  // no-qa
  console.log("Processing:", filePath);

  const sourceText = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);

  const result = ts.transform(sourceFile, [transformer(sourceFile)]);
  const printer = ts.createPrinter();
  const newContent = printer.printFile(result.transformed[0] as ts.SourceFile);

  if (sourceText !== newContent) {
    fs.writeFileSync(filePath, newContent);
    modifiedFiles++;
    modifiedFilePaths.push(filePath);
  }
});

if (modifiedFilePaths.length > 0) {
  // no-qa
  console.log(`\nModified ${modifiedFiles} files:`);
  modifiedFilePaths.forEach((filePath) => {
    // no-qa
    console.log(`- ${filePath}`);
  });
} else {
  // no-qa
  console.log("No files needed modification");
}

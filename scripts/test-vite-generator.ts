// scripts/test-vite-generator.ts

import fs from "fs/promises";
import path from "path";

async function cleanupFile(filepath: string) {
  await fs.unlink(filepath).catch(() => {});
  const dir = path.dirname(filepath);
  // Read the directory contents
  const files = await fs.readdir(dir).catch(() => []);
  // If directory is empty, remove it
  if (files.length === 0) {
    await fs.rmdir(dir).catch(() => {});
  }
}

async function main() {
  const TEST_ACTION_PATH = path.join(process.cwd(), "app/actions/test-action.server.ts");
  const GENERATED_FILE_PATH = path.join(process.cwd(), "app/lib/generated/actions.ts");

  try {
    // Create the test action file
    const actionContent =
      '// app/actions/test-action.server.ts\n\nexport async function testAction() {\n    return { message: "test action" };\n}\n';
    await fs.writeFile(TEST_ACTION_PATH, actionContent);
    console.log("Created test action file");

    // Wait for Vite to process it
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if Vite generated the mapping file
    const generatedExists = await fs.stat(GENERATED_FILE_PATH).catch(() => false);
    if (!generatedExists) {
      throw new Error("Vite did not generate the actions mapping file!");
    }

    const content = await fs.readFile(GENERATED_FILE_PATH, "utf-8");
    if (!content.includes("testAction")) {
      throw new Error("Generated file does not contain the new action!");
    }
  } finally {
    await cleanupFile(TEST_ACTION_PATH);
    await cleanupFile(GENERATED_FILE_PATH);
  }
}

main().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});

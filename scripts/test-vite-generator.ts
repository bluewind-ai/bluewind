// // scripts/test-vite-generator.ts

// import fs from "fs/promises";
// import path from "path";

// async function cleanupFile(filepath: string) {
//   await fs.unlink(filepath).catch(() => {});
//   const dir = path.dirname(filepath);
//   const files = await fs.readdir(dir).catch(() => []);
//   if (files.length === 0) {
//     await fs.rmdir(dir).catch(() => {});
//   }
// }

// async function main() {
//   const TEST_ACTION_PATH = path.join(process.cwd(), "app/actions/test-action.server.ts");
//   const GENERATED_FILE_PATH = path.join(process.cwd(), "app/lib/generated/actions.ts");

//   console.log("Starting test...");

//   try {
//     // Create the test action file
//     const actionContent =
//       '// app/actions/test-action.server.ts\n\nexport async function testAction() {\n    return { message: "test action" };\n}\n';
//     await fs.writeFile(TEST_ACTION_PATH, actionContent);
//     console.log("Created test action file");

//     // Wait for Vite to process it
//     console.log("Waiting for Vite to process...");
//     await new Promise((resolve) => setTimeout(resolve, 1000));

//     // Check if Vite generated the mapping file
//     const generatedExists = await fs.stat(GENERATED_FILE_PATH).catch(() => false);
//     console.log("Generated file exists?", !!generatedExists);

//     if (!generatedExists) {
//       throw new Error("Vite did not generate the actions mapping file!");
//     }

//     const content = await fs.readFile(GENERATED_FILE_PATH, "utf-8");
//     console.log("Generated file content:", content);

//     // Check if our action is there
//     if (!content.includes("testAction")) {
//       throw new Error("Generated file doesn't contain testAction!");
//     }

//     console.log("Test passed!");
//   } catch (error) {
//     console.error("Test failed:", error);
//     process.exit(1);
//   } finally {
//     console.log("Cleaning up...");
//     await cleanupFile(TEST_ACTION_PATH);
//     await cleanupFile(GENERATED_FILE_PATH);
//   }
// }

// console.log("Test script starting...");
// main().catch((error) => {
//   console.error("Test failed:", error);
//   process.exit(1);
// });

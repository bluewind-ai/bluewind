// // vite-plugins/generate-actions.ts

// import fs from "fs/promises";
// import path from "path";
// import { glob } from "glob";
// import type { Plugin } from "vite";

// function kebabToCamel(str: string): string {
//   return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
// }

// async function generateActionsFile() {
//   // Find all action files
//   const actionFiles = await glob("app/actions/*.server.ts");

//   // Generate the content
//   const content = `// app/lib/generated/actions.ts
// // This file is auto-generated. Do not edit it manually.

// ${actionFiles
//   .map((file) => {
//     const basename = path.basename(file, ".server.ts");
//     const camelName = kebabToCamel(basename);
//     return `import { ${camelName} } from "~/actions/${basename}.server";`;
//   })
//   .join("\n")}

// export const actions = {
//   ${actionFiles
//     .map((file) => {
//       const basename = path.basename(file, ".server.ts");
//       const camelName = kebabToCamel(basename);
//       return `"${basename}": ${camelName}`;
//     })
//     .join(",\n  ")}
// } as const;`;

//   // Ensure directory exists
//   await fs.mkdir("app/lib/generated", { recursive: true });

//   // Write the file
//   await fs.writeFile("app/lib/generated/actions.ts", content);
//   console.log("Generated actions.ts");
// }

// export function actionsPlugin(): Plugin {
//   return {
//     name: "vite:actions",
//     configureServer(server) {
//       // Generate on startup
//       generateActionsFile();

//       server.watcher.on("add", async (path) => {
//         if (path.includes("/actions/") && path.endsWith(".server.ts")) {
//           console.log("Action file added:", path);
//           await generateActionsFile();
//         }
//       });

//       server.watcher.on("change", async (path) => {
//         if (path.includes("/actions/") && path.endsWith(".server.ts")) {
//           console.log("Action file changed:", path);
//           await generateActionsFile();
//         }
//       });

//       server.watcher.on("unlink", async (path) => {
//         if (path.includes("/actions/") && path.endsWith(".server.ts")) {
//           console.log("Action file removed:", path);
//           await generateActionsFile();
//         }
//       });
//     },
//   };
// }

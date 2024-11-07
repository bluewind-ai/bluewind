// vite.config.ts

import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig, Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import { flatRoutes } from "remix-flat-routes";
import fs from "fs/promises";
import path from "path";
import { glob } from "glob";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

async function generateActionsFile() {
  // Find all action files
  const actionFiles = await glob("app/actions/*.server.ts");

  // Generate the content
  const content = `// app/lib/generated/actions.ts
// This file is auto-generated. Do not edit it manually.

${actionFiles
  .map((file) => {
    const basename = path.basename(file, ".server.ts");
    const camelName = kebabToCamel(basename);
    return `import { ${camelName} } from "~/actions/${basename}.server";`;
  })
  .join("\n")}

export const actions = {
  ${actionFiles
    .map((file) => {
      const basename = path.basename(file, ".server.ts");
      const camelName = kebabToCamel(basename);
      return `"${basename}": ${camelName}`;
    })
    .join(",\n  ")}
} as const;`;

  // Ensure directory exists
  await fs.mkdir("app/lib/generated", { recursive: true });

  // Write the file
  await fs.writeFile("app/lib/generated/actions.ts", content);
  console.log("Generated actions.ts");
}

function actionsPlugin(): Plugin {
  return {
    name: "vite:actions",
    configureServer(server) {
      // Generate on startup
      generateActionsFile();

      server.watcher.on("add", async (path) => {
        if (path.includes("/actions/") && path.endsWith(".server.ts")) {
          console.log("Action file added:", path);
          await generateActionsFile();
        }
      });

      server.watcher.on("change", async (path) => {
        if (path.includes("/actions/") && path.endsWith(".server.ts")) {
          console.log("Action file changed:", path);
          await generateActionsFile();
        }
      });

      server.watcher.on("unlink", async (path) => {
        if (path.includes("/actions/") && path.endsWith(".server.ts")) {
          console.log("Action file removed:", path);
          await generateActionsFile();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
      serverModuleFormat: "esm",
      routes: async (defineRoutes) => {
        return flatRoutes("routes", defineRoutes);
      },
    }),
    tsconfigPaths(),
    actionsPlugin(),
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          content: ["./app/**/*.{js,jsx,ts,tsx}"],
        }),
        autoprefixer(),
      ],
    },
  },
  publicDir: "public",
});

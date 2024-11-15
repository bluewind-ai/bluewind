// vite.config.ts

import { vitePlugin as remix } from "@remix-run/dev";
import autoprefixer from "autoprefixer";
import { expressDevServer } from "remix-express-dev-server";
import { flatRoutes } from "remix-flat-routes";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import { denyImports, envOnlyMacros } from "vite-env-only";
import tsconfigPaths from "vite-tsconfig-paths";

// import { serverFunctionsPlugin } from "./vite-plugins/generate-serverFunctions";
import { requestLoggerPlugin } from "./vite-plugins/request-logger";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    expressDevServer(),
    denyImports({}),
    envOnlyMacros(),
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
    // serverFunctionsPlugin(),
    // appsPlugin(),
    requestLoggerPlugin(),
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
  logLevel: "info",
  clearScreen: false,
});

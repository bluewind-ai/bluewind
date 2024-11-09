// vite.config.ts

import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import { flatRoutes } from "remix-flat-routes";
// import { actionsPlugin } from "./vite-plugins/generate-actions";
import { requestLoggerPlugin } from "./vite-plugins/request-logger";
import { appsPlugin } from "./vite-plugins/generate-apps";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
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
    // actionsPlugin(),
    appsPlugin(),
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

// app/lib/server-functions.ts

import { bootstrap } from "~/functions/bootstrap.server";
import { generateRoutes } from "~/functions/generate-routes.server";
import { goNext } from "~/functions/go-next.server";
import { loadNavigationData } from "~/functions/load-navigation-data.server";
import { updateFiles } from "~/functions/update-files.server";
import type { ExtendedContext } from "~/middleware";

import type { ServerFunctionName } from "./server-functions-types";

export const SERVER_FUNCTIONS_HANDLERS: Record<
  ServerFunctionName,
  {
    handler: (context: ExtendedContext) => Promise<void>;
  }
> = {
  bootstrap: {
    handler: bootstrap,
  },
  updateFiles: {
    handler: updateFiles,
  },
  generateRoutes: {
    handler: async (_request: ExtendedContext) => {
      await generateRoutes();
    },
  },
  loadNavigationData: {
    handler: async (request: ExtendedContext) => {
      await loadNavigationData(request);
    },
  },
  goNext: {
    handler: async (request: ExtendedContext) => {
      await goNext(request);
    },
  },
};

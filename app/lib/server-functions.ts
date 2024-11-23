// app/lib/server-functions.ts
import { bootstrap } from "~/functions/bootstrap.server";
import { generateRoutes } from "~/functions/generate-routes.server";
import { loadNavigationData } from "~/functions/load-navigation-data.server";
import { truncateDb } from "~/functions/truncate-db.server";
import { updateFiles } from "~/functions/update-files.server";
import type { RequestExtensions } from "~/middleware";

import type { ServerFunctionName } from "./server-functions-types";

export const SERVER_FUNCTIONS_HANDLERS: Record<
  ServerFunctionName,
  {
    handler: (context: RequestExtensions) => Promise<void>;
  }
> = {
  truncateDb: {
    handler: truncateDb,
  },
  bootstrap: {
    handler: bootstrap,
  },
  updateFiles: {
    handler: updateFiles,
  },
  generateRoutes: {
    handler: async (_request: RequestExtensions) => {
      await generateRoutes();
    },
  },
  loadNavigationData: {
    handler: async (request: RequestExtensions) => {
      await loadNavigationData(request);
    },
  },
};

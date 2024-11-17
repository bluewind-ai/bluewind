// app/lib/server-functions.ts

import { bootstrap } from "~/functions/bootstrap.server";
import { generateRoutes } from "~/functions/generate-routes.server";
import { goNext } from "~/functions/go-next.server";
import { loadFiles } from "~/functions/load-files.server";
import { resetAll } from "~/functions/reset-all.server";
import { truncateDb } from "~/functions/truncate-db.server";
import { updateFiles } from "~/functions/update-files.server";

export const SERVER_FUNCTIONS = {
  goNext: {
    label: "Go Next",
    variant: "outline" as const,
    handler: goNext,
  },
  loadFiles: {
    label: "Load Files",
    variant: "outline" as const,
    handler: loadFiles,
  },
  resetAll: {
    label: "Reset All",
    variant: "destructive" as const,
    handler: resetAll,
  },
  truncateDb: {
    label: "Truncate DB",
    variant: "destructive" as const,
    handler: truncateDb,
  },
  bootstrap: {
    label: "Bootstrap DB",
    variant: "outline" as const,
    handler: bootstrap,
  },
  generateRoutes: {
    label: "Generate All Routes",
    variant: "outline" as const,
    handler: generateRoutes,
  },
  updateFiles: {
    label: "Update Files",
    variant: "outline" as const,
    handler: updateFiles,
  },
} as const;

export type ServerFunctionName = keyof typeof SERVER_FUNCTIONS;

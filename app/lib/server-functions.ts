// app/lib/server-functions.ts

import { bootstrap } from "~/functions/bootstrap.server";
import { truncateDb } from "~/functions/truncate-db.server";
import { updateFiles } from "~/functions/update-files.server";

export const SERVER_FUNCTIONS = {
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
  updateFiles: {
    label: "Update Files",
    variant: "outline" as const,
    handler: updateFiles,
  },
} as const;

export type ServerFunctionName = keyof typeof SERVER_FUNCTIONS;

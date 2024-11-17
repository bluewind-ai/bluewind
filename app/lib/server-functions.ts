// app/lib/server-functions.ts

import { bootstrap } from "~/functions/bootstrap.server";
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
  truncateDb: { handler: truncateDb },
  bootstrap: { handler: bootstrap },
  updateFiles: { handler: updateFiles },
};

// app/functions/master.server.ts

import { createAction } from "~/lib/action-builder.server";

import { loadFiles } from "./load-files.server";

export const master = createAction("master", async () => {
  await loadFiles();
});

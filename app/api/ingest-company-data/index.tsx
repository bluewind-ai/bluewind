// app/api/ingest-company-data/index.tsx

import { Hono } from "hono";

import { fetchWithContext } from "~/lib/fetch-with-context";
import { serverFn } from "~/lib/server-functions";

const app = new Hono();
app.post("/api/ingest-company-data", async (c) => {
  console.log("I am running the ingest company data route");
  const hashResponse = await fetchWithContext(c)("http://localhost:5173/api/get-directory-hash", {
    method: "POST",
  }).then((r) => r.json());

  const filesResponse = await serverFn.listSourceFiles(c, {
    mtime: hashResponse.mtimeRaw,
    directory: hashResponse.directory,
  });

  return c.json({
    message: "Directory processed",
    directoryInfo: {
      path: hashResponse.directory,
      mtime: hashResponse.mtime,
      ctime: hashResponse.ctime,
    },
    files: filesResponse.files,
  });
});

export default app;

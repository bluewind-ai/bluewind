// app/api/ingest-company-data/index.tsx

import { Hono } from "hono";

import { fetchWithContext } from "~/lib/fetch-with-context";

const app = new Hono();
app.post("/api/ingest-company-data", async (c) => {
  console.log("I am running the ingest company data route");
  const hashResponse = await fetchWithContext(c)("http://localhost:5173/api/get-directory-hash", {
    method: "POST",
  }).then((r) => r.json());

  // Then get the file list with the directory info
  const filesResponse = await fetchWithContext(c)("http://localhost:5173/api/list-source-files", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mtime: hashResponse.mtimeRaw,
      directory: hashResponse.directory,
    }),
  }).then((r) => r.json());

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

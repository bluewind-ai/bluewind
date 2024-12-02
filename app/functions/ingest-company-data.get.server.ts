// app/functions/ingest-company-data.get.server.ts
import { serverFn } from "~/lib/server-functions";

export async function ingestCompanyData(c: any) {
  const hashResponse = await serverFn.getDirectoryHash(c);
  const filesResponse = await serverFn.listSourceFiles(c, {
    mtime: hashResponse.mtimeRaw,
    directory: hashResponse.directory,
  });
  return {
    message: "Directory processed",
    directoryInfo: {
      path: hashResponse.directory,
      mtime: hashResponse.mtime,
      ctime: hashResponse.ctime,
    },
    files: filesResponse.files,
  };
}

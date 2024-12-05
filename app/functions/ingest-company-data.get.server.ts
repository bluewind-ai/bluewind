// app/functions/ingest-company-data.get.server.ts
import { z } from "zod";

import { serverFn } from "~/lib/server-functions";

export const ingestCompanyDataInputSchema = z.object({});
export const ingestCompanyDataOutputSchema = z.object({
  message: z.string(),
  directoryInfo: z.object({
    path: z.string(),
    mtime: z.string(),
    ctime: z.string(),
  }),
  files: z.array(z.string()),
});
export type IngestCompanyDataInput = z.infer<typeof ingestCompanyDataInputSchema>;
export type IngestCompanyDataOutput = z.infer<typeof ingestCompanyDataOutputSchema>;
export async function ingestCompanyData(
  c: any,
  input: IngestCompanyDataInput,
): Promise<IngestCompanyDataOutput> {
  const hashResponse = await serverFn.getDirectoryHash(c);
  const filesResponse = await serverFn.listSourceFiles(c, {}); // Changed to pass empty object
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

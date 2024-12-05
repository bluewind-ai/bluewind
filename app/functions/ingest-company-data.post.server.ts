

// app/functions/ingest-company-data.post.server.ts

import { readdir, stat } from "fs/promises";
import { z } from "zod";

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
  try {
    const directory = "app/functions"; 
    const stats = await stat(directory);
    const files = await readdir(directory);

    return {
      message: "Company data ingested successfully",
      directoryInfo: {
        path: directory,
        mtime: stats.mtime.toISOString(),
        ctime: stats.ctime.toISOString(),
      },
      files,
    };
  } catch (error) {
    
    return {
      message: "Failed to ingest company data",
      directoryInfo: {
        path: "app/functions",
        mtime: new Date().toISOString(),
        ctime: new Date().toISOString(),
      },
      files: [],
    };
  }
}

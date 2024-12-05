// app/functions/get-directory-hash.get.server.ts
import { stat } from "node:fs/promises";
import { resolve } from "node:path";

import { z } from "zod";
// Schema definitions
export const getDirectoryHashInputSchema = z.object({});
export const getDirectoryHashOutputSchema = z.object({
  mtime: z.string(),
  ctime: z.string(),
  mtimeRaw: z.number(),
  ctimeRaw: z.number(),
  directory: z.string(),
});
export type GetDirectoryHashInput = z.infer<typeof getDirectoryHashInputSchema>;
export type GetDirectoryHashOutput = z.infer<typeof getDirectoryHashOutputSchema>;
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString("en-US", {
    timeZone: "UTC",
    timeZoneName: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
export async function getDirectoryHash(
  c: any,
  input: GetDirectoryHashInput,
): Promise<GetDirectoryHashOutput> {
  try {
    const dirPath = resolve("app");
    const dirStat = await stat(dirPath);
    const mtime = dirStat.mtimeMs;
    const ctime = dirStat.ctimeMs;
    return {
      mtime: formatDate(mtime),
      ctime: formatDate(ctime),
      mtimeRaw: mtime,
      ctimeRaw: ctime,
      directory: "../bluewind-data/sec-submissions",
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

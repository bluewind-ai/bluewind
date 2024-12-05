// app/functions/get-directory-hash.post.server.ts

import { stat } from "fs/promises";
import { z } from "zod";

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

export async function getDirectoryHash(
  c: any,
  input: GetDirectoryHashInput,
): Promise<GetDirectoryHashOutput> {
  const directory = "app/functions";
  const stats = await stat(directory);

  return {
    mtime: stats.mtime.toISOString(),
    ctime: stats.ctime.toISOString(),
    mtimeRaw: stats.mtimeMs,
    ctimeRaw: stats.ctimeMs,
    directory,
  };
}

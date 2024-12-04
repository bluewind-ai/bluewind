// app/functions/list-source-files.get.server.ts

import { relative, resolve } from "node:path";

import { z } from "zod";

import { readdir } from "~/lib/intercepted-fs";

export const listSourceFilesInputSchema = z.object({});

export const listSourceFilesOutputSchema = z.object({
  files: z.array(z.string()),
  directory: z.string(),
});

export type ListSourceFilesInput = z.infer<typeof listSourceFilesInputSchema>;
export type ListSourceFilesOutput = z.infer<typeof listSourceFilesOutputSchema>;

export async function listSourceFiles(
  c: any,
  input: ListSourceFilesInput,
): Promise<ListSourceFilesOutput> {
  try {
    const rootPath = resolve("app");
    const entries = await readdir(rootPath, { withFileTypes: true, recursive: true });
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const fullPath = resolve(rootPath, entry.path, entry.name);
        return relative(rootPath, fullPath);
      });
    return {
      files,
      directory: "../bluewind-data/sec-submissions",
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

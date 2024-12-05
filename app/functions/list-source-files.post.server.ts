// app/functions/list-source-files.post.server.ts
import { readdir } from "fs/promises";
import { z } from "zod";

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
  const directory = "app/functions";
  const files = await readdir(directory);
  return {
    files,
    directory,
  };
}

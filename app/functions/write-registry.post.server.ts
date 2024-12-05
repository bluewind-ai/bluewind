// app/functions/write-registry.post.server.ts
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

export const writeRegistryInputSchema = z.object({
  fileContent: z.string(),
});
export const writeRegistryOutputSchema = z.object({
  success: z.boolean(),
});
export type WriteRegistryInput = z.infer<typeof writeRegistryInputSchema>;
export type WriteRegistryOutput = z.infer<typeof writeRegistryOutputSchema>;
export async function writeRegistry(
  c: any,
  input: WriteRegistryInput,
): Promise<WriteRegistryOutput> {
  const filePath = path.join(process.cwd(), "app", "lib", "server-functions.ts");
  await fs.writeFile(filePath, input.fileContent);
  return { success: true };
}

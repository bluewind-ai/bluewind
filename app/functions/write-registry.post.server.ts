

// app/functions/write-registry.post.server.ts

import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

export const writeRegistryInputSchema = z.object({
  registry: z.record(
    z.object({
      name: z.string(),
      path: z.string(),
      inputSchema: z.any(),
      outputSchema: z.any(),
    }),
  ),
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
  const registryPath = path.join(process.cwd(), "app", "functions", "registry.json");
  await fs.writeFile(registryPath, JSON.stringify(input.registry, null, 2));
  return { success: true };
}

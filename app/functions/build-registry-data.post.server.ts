// app/functions/build-registry-data.post.server.ts

import { z } from "zod";

import { serverFn } from "~/lib/server-functions";

export const buildRegistryDataInputSchema = z.object({
  functions: z.array(
    z.object({
      name: z.string(),
      path: z.string(),
    }),
  ),
});

export const buildRegistryDataOutputSchema = z.object({
  registry: z.record(
    z.object({
      name: z.string(),
      path: z.string(),
      inputSchema: z.any(),
      outputSchema: z.any(),
    }),
  ),
});

export type BuildRegistryDataInput = z.infer<typeof buildRegistryDataInputSchema>;
export type BuildRegistryDataOutput = z.infer<typeof buildRegistryDataOutputSchema>;

export async function buildRegistryData(
  c: any,
  input: BuildRegistryDataInput,
): Promise<BuildRegistryDataOutput> {
  const registry: Record<string, any> = {};

  for (const func of input.functions) {
    const name = func.name.toLowerCase();
    if (serverFn.schemas[name] && serverFn.outputSchemas[name]) {
      registry[name] = {
        name: func.name,
        path: func.path,
        inputSchema: serverFn.schemas[name],
        outputSchema: serverFn.outputSchemas[name],
      };
    }
  }

  return { registry };
}

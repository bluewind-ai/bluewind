// app/functions/build-function-registry.get.server.ts

import { z } from "zod";

import { serverFn } from "~/lib/server-functions";

export const buildFunctionRegistryInputSchema = z.object({});
export const buildFunctionRegistryOutputSchema = z.object({
  success: z.boolean(),
});

export type BuildFunctionRegistryInput = z.infer<typeof buildFunctionRegistryInputSchema>;
export type BuildFunctionRegistryOutput = z.infer<typeof buildFunctionRegistryOutputSchema>;

export async function buildFunctionRegistry(
  c: any,
  input: BuildFunctionRegistryInput,
): Promise<BuildFunctionRegistryOutput> {
  try {
    // Step 1: Get list of functions
    const { functions } = await serverFn.getFunctionList(c);

    // Step 2: Build registry data
    const { registry } = await serverFn.buildRegistryData(c, { functions });

    // Step 3: Write registry to file
    await serverFn.writeRegistry(c, { registry });

    return { success: true };
  } catch (error) {
    console.error("Error building function registry:", error);
    return { success: false };
  }
}

// app/functions/build-function-registry.post.server.ts

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
    const { functions } = await serverFn.getFunctionList(c);

    const { registry } = await serverFn.buildRegistryData(c, { functions });

    await serverFn.writeRegistry(c, { registry });

    return { success: true };
  } catch (error) {
    console.error("Error building function registry:", error);
    return { success: false };
  }
}

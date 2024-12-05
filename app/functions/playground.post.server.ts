// app/functions/playground.post.server.ts

import { z } from "zod";

import { serverFn } from "~/lib/server-functions";

export const playgroundInputSchema = z.object({});
export const playgroundOutputSchema = z.object({
  functions: z.array(
    z.object({
      name: z.string(),
      path: z.string(),
      exports: z.array(z.string()),
      content: z.string(),
    }),
  ),
});
export type PlaygroundInput = z.infer<typeof playgroundInputSchema>;
export type PlaygroundOutput = z.infer<typeof playgroundOutputSchema>;
export async function playground(c: any, input: PlaygroundInput): Promise<PlaygroundOutput> {
  await serverFn.newBuildFunctionRegistry(c, {});
}

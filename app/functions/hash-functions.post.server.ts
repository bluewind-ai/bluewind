// app/functions/hash-functions.post.server.ts

import crypto from "crypto";
import { z } from "zod";

export const hashFunctionsInputSchema = z.object({
  functions: z.array(
    z.object({
      name: z.string(),
      path: z.string(),
      exports: z.array(z.string()),
      content: z.string(),
    }),
  ),
});
export const hashFunctionsOutputSchema = z.object({
  functions: z.array(
    z.object({
      name: z.string(),
      path: z.string(),
      exports: z.array(z.string()),
      content: z.string(),
      hash: z.string(),
    }),
  ),
});
export type HashFunctionsInput = z.infer<typeof hashFunctionsInputSchema>;
export type HashFunctionsOutput = z.infer<typeof hashFunctionsOutputSchema>;

export async function hashFunctions(
  c: any,
  input: HashFunctionsInput,
): Promise<HashFunctionsOutput> {
  const functions = input.functions.map((fn) => ({
    ...fn,
    hash: crypto.createHash("sha256").update(fn.content).digest("hex"),
  }));

  return { functions };
}

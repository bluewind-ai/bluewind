// app/functions/get-function-list.post.server.ts

import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

export const getFunctionListInputSchema = z.object({});
export const getFunctionListOutputSchema = z.object({
  functions: z.array(
    z.object({
      name: z.string(),
      path: z.string(),
    }),
  ),
});

export type GetFunctionListInput = z.infer<typeof getFunctionListInputSchema>;
export type GetFunctionListOutput = z.infer<typeof getFunctionListOutputSchema>;

export async function getFunctionList(
  c: any,
  input: GetFunctionListInput,
): Promise<GetFunctionListOutput> {
  const functionsDir = path.join(process.cwd(), "app", "functions");
  const files = await fs.readdir(functionsDir);
  const serverFiles = files.filter((file) => file.endsWith(".server.ts"));

  return {
    functions: serverFiles.map((file) => ({
      name: path.basename(file, ".get.server.ts").replace(/-/g, ""),
      path: path.join("app", "functions", file),
    })),
  };
}

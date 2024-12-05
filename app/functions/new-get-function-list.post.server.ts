// app/functions/new-get-function-list.post.server.ts

import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

export const newGetFunctionListInputSchema = z.object({});
export const newGetFunctionListOutputSchema = z.object({
  functions: z.array(
    z.object({
      name: z.string(),
      path: z.string(),
      exports: z.array(z.string()),
      content: z.string(),
    }),
  ),
});
export type GetFunctionListInput = z.infer<typeof newGetFunctionListInputSchema>;
export type GetFunctionListOutput = z.infer<typeof newGetFunctionListOutputSchema>;
export async function newGetFunctionList(
  c: any,
  input: GetFunctionListInput,
): Promise<GetFunctionListOutput> {
  const functionsDir = path.join(process.cwd(), "app", "functions");
  const files = await fs.readdir(functionsDir);
  const serverFiles = files.filter((file) => file.endsWith(".server.ts"));
  const functions = [];
  for (const file of serverFiles) {
    const fullPath = path.join(functionsDir, file);
    const content = await fs.readFile(fullPath, "utf-8");

    const exportMatches =
      content.match(/export (?:(?:async )?function|const|type|interface) (\w+)/g) || [];
    const exports = exportMatches.map((match) =>
      match.split(/function|const|type|interface/)[1].trim(),
    );
    functions.push({
      name: path.basename(file, ".server.ts").replace(/-/g, ""),
      path: path.join("app", "functions", file),
      exports: exports,
      content: content,
    });
  }
  return { functions };
}

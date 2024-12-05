// app/functions/new-build-registry-data.post.server.ts

import { z } from "zod";

export const newBuildRegistryDataInputSchema = z.object({
  functions: z.array(
    z.object({
      name: z.string(),
      path: z.string(),
      exports: z.array(z.string()),
    }),
  ),
});
export const newBuildRegistryDataOutputSchema = z.object({
  fileContent: z.string(),
});
export type BuildRegistryDataInput = z.infer<typeof newBuildRegistryDataInputSchema>;
export type BuildRegistryDataOutput = z.infer<typeof newBuildRegistryDataOutputSchema>;
export async function newBuildRegistryData(
  c: any,
  input: BuildRegistryDataInput,
): Promise<BuildRegistryDataOutput> {
  const imports: string[] = [];
  const entries: string[] = [];
  const schemaEntries: string[] = [];
  const outputSchemaEntries: string[] = [];
  for (const func of input.functions) {
    const basePath = func.path.replace(/^app\//, "~/");
    const baseImportPath = basePath.replace(".ts", "");
    const uniqueExports = [...new Set(func.exports)];
    if (uniqueExports.length > 0) {
      const mainExport = uniqueExports.find(
        (e) =>
          !e.includes("Schema") &&
          !e.includes("Input") &&
          !e.includes("Output") &&
          e === e[0].toLowerCase() + e.slice(1),
      );
      const inputSchema = uniqueExports.find((e) => e.includes("InputSchema"));
      const outputSchema = uniqueExports.find((e) => e.includes("OutputSchema"));
      const types = uniqueExports
        .filter((e) => e.includes("Input") && !e.includes("Schema"))
        .map((e) => e.replace(/Input$/, "Output"));
      const allImports = [mainExport, ...types, inputSchema, outputSchema].filter(Boolean);
      if (allImports.length > 0) {
        imports.push(`import { ${allImports.join(", ")} } from "${baseImportPath}";`);
      }
      if (mainExport) {
        entries.push(`  ${mainExport}: ${mainExport}`);
      }
      if (inputSchema && mainExport) {
        const schemaKey = mainExport.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
        schemaEntries.push(`    ${schemaKey}: ${inputSchema}`);
      }
      if (outputSchema && mainExport) {
        const schemaKey = mainExport.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
        outputSchemaEntries.push(`    ${schemaKey}: ${outputSchema}`);
      }
    }
  }
  const fileContent = `// app/lib/server-functions.ts
// THIS FILE IS AUTO-GENERATED - DO NOT EDIT!

import { wrapServerFunction } from "./api-wrapper";
${imports.join("\n")}

export const functions = {
${entries.join(",\n")}
} as const;

export const serverFn = {
 ...Object.fromEntries(
   Object.entries(functions).map(([name, fn]) => [
     name,
     wrapServerFunction(\`\${name}.post.server\`, fn),
   ]),
 ),
 schemas: {
${schemaEntries.join(",\n")}
 },
 outputSchemas: {
${outputSchemaEntries.join(",\n")}
 },
} as const;

// Export types
export type { ChatInput };`;
  return { fileContent };
}

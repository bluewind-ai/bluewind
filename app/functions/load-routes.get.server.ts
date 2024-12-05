// app/functions/load-routes.get.server.ts

import { readdir } from "fs/promises";
import { z } from "zod";

export const loadRoutesInputSchema = z.object({});

export const loadRoutesOutputSchema = z.object({
  success: z.boolean(),
  routes: z.array(z.string()),
  routesHash: z.record(z.string()),
  appRoutesMap: z.record(z.any()),
});

export type LoadRoutesInput = z.infer<typeof loadRoutesInputSchema>;
export type LoadRoutesOutput = z.infer<typeof loadRoutesOutputSchema>;

export async function loadRoutes(c: any, input: LoadRoutesInput): Promise<LoadRoutesOutput> {
  const directory = "app/routes";
  const files = await readdir(directory);

  const routesHash: Record<string, string> = {};
  const appRoutesMap: Record<string, any> = {};

  files.forEach((file) => {
    const route = file.replace(/\.tsx?$/, "");
    routesHash[route] = file;
    appRoutesMap[route] = { path: `/${route}` };
  });

  return {
    success: true,
    routes: files,
    routesHash,
    appRoutesMap,
  };
}

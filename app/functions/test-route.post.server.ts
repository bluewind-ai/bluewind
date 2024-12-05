
// app/functions/test-route.post.server.ts

import { z } from "zod";

import { serverFn } from "~/lib/server-functions";

export const testRouteInputSchema = z.object({});
export const testRouteOutputSchema = z.object({
  message: z.string(),
  directoryInfo: z.object({
    path: z.string(),
    mtime: z.string(),
    ctime: z.string(),
  }),
  files: z.array(z.string()),
});
export type TestRouteInput = z.infer<typeof testRouteInputSchema>;
export type TestRouteOutput = z.infer<typeof testRouteOutputSchema>;
export async function testRoute(c: any, input: TestRouteInput): Promise<TestRouteOutput> {
  const result = await serverFn.ingestCompanyData(c);
  return result;
}

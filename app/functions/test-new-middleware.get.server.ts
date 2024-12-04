// app/functions/test-new-middleware.get.server.ts

import { z } from "zod";

export const testNewMiddlewareInputSchema = z.object({});

export const testNewMiddlewareOutputSchema = z.object({
  tested: z.number(),
});

export type TestNewMiddlewareInput = z.infer<typeof testNewMiddlewareInputSchema>;
export type TestNewMiddlewareOutput = z.infer<typeof testNewMiddlewareOutputSchema>;

export async function testNewMiddleware(
  c: any,
  input: TestNewMiddlewareInput,
): Promise<TestNewMiddlewareOutput> {
  return {
    tested: c.requestId,
  };
}

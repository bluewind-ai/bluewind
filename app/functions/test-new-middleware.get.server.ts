// app/functions/test-new-middleware.get.server.ts

export async function testNewMiddleware(c) {
  return {
    tested: c.requestId,
  };
}

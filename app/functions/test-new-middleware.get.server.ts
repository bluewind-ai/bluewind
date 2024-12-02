// app/functions/test-new-middleware.get.server.ts

export async function testNewMiddleware(requestId: number) {
  return {
    tested: true,
  };
}

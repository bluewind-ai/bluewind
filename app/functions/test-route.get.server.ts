// app/functions/test-route.get.server.ts
import { serverFn } from "~/lib/server-functions";

export async function testRoute(c: any) {
  const result = await serverFn.ingestCompanyData(c);
  return result;
}

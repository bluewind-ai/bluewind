// app/functions/main-flow.get.server.ts

import { serverFn } from "~/lib/server-functions";

export async function mainFlow(c: any) {
  await serverFn.setupInitialize(c);
  await serverFn.ingestCompanyData(c);
  await serverFn.testRoute(c);
  await serverFn.evalNewPatientBookingFlow(c);
  return { success: true };
}

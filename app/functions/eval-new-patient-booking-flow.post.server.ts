// app/functions/eval-new-patient-booking-flow.post.server.ts

import { z } from "zod";

import { serverFn } from "~/lib/server-functions";

export const evalNewPatientBookingFlowInputSchema = z.object({});
export const evalNewPatientBookingFlowOutputSchema = z.object({
  success: z.boolean(),
  requestId: z.number(),
});

export async function evalNewPatientBookingFlow(c: any) {
  const result = await serverFn.twilio(c, {
    to: process.env.BACKEND_PHONE_NUMBER!,
    from: process.env.USER_PHONE_NUMBER!,
    body: "Hello from your app!",
  });

  return {
    success: true,
    requestId: c.requestId,
  };
}

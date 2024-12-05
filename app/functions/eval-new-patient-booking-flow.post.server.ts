// app/functions/eval-new-patient-booking-flow.post.server.ts

import { z } from "zod";

import { serverFn } from "~/lib/server-functions";

export const evalNewPatientBookingFlowInputSchema = z.object({});
export const evalNewPatientBookingFlowOutputSchema = z.object({
  success: z.boolean(),
  requestId: z.number(),
});
export async function evalNewPatientBookingFlow(c: any) {
  try {
    const response1 = await serverFn.chat(c, {
      input: "Hi, I'd like to book an appointment",
    });
    const response2 = await serverFn.chat(c, {
      requestId: response1.requestId,
      input: "I'm a new patient",
    });
    const response3 = await serverFn.chat(c, {
      requestId: response2.requestId,
      input: "John Smith, 01/15/1980, (555) 123-4567",
    });
    const response4 = await serverFn.chat(c, {
      requestId: response3.requestId,
      input: "I need a general checkup",
    });
    const response5 = await serverFn.chat(c, {
      requestId: response4.requestId,
      input: "Yes, I have Blue Cross Blue Shield",
    });
    const response6 = await serverFn.chat(c, {
      requestId: response5.requestId,
      input: "Monday at 10:00 AM works for me",
    });

    return {
      success: true,
      requestId: c.requestId,
    };
  } catch (error) {
    throw error;
  }
}

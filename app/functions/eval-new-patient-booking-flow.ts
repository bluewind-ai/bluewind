// app/functions/eval-new-patient-booking-flow.ts

import { serverFn } from "~/lib/server-functions";

export async function evalNewPatientBookingFlow(c: any) {
  try {
    // Each chat call gets back a requestId that we need to pass to the next call
    const response1 = await serverFn.chat(c, {
      input: "Hi, I'd like to book an appointment",
    });

    console.log("Sending payload:", {
      requestId: response1.requestId,
      input: "I'm a new patient",
    });
    const response2 = await serverFn.chat(c, {
      requestId: response1.requestId,
      input: "I'm a new patient",
    });

    console.log("Sending payload:", {
      requestId: response2.requestId,
      input: "John Smith, 01/15/1980, (555) 123-4567",
    });
    const response3 = await serverFn.chat(c, {
      requestId: response2.requestId,
      input: "John Smith, 01/15/1980, (555) 123-4567",
    });

    console.log("Sending payload:", {
      requestId: response3.requestId,
      input: "I need a general checkup",
    });
    const response4 = await serverFn.chat(c, {
      requestId: response3.requestId,
      input: "I need a general checkup",
    });

    console.log("Sending payload:", {
      requestId: response4.requestId,
      input: "Yes, I have Blue Cross Blue Shield",
    });
    const response5 = await serverFn.chat(c, {
      requestId: response4.requestId,
      input: "Yes, I have Blue Cross Blue Shield",
    });

    console.log("Sending payload:", {
      requestId: response5.requestId,
      input: "Monday at 10:00 AM works for me",
    });
    const response6 = await serverFn.chat(c, {
      requestId: response5.requestId,
      input: "Monday at 10:00 AM works for me",
    });

    return c.json({ success: true, requestId: response6.requestId });
  } catch (error) {
    console.error("Error in flow:", error);
    throw error;
  }
}

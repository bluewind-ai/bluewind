// app/functions/eval-new-patient-booking-flow.ts

import { serverFn } from "~/lib/server-functions";

export async function evalNewPatientBookingFlow(c: any) {
  console.log("Starting evalNewPatientBookingFlow");
  const conversation = [];

  async function processMessage(input: string) {
    console.log("processMessage input:", input);
    try {
      console.log("Making request with input:", { input });
      const response = await serverFn.chat(c, { input });
      console.log("Chat response received:", response);

      conversation.push(
        { role: "patient", message: input },
        { role: "ai", message: response.response },
      );
      return response.response;
    } catch (error) {
      console.error("Error in processMessage:", error);
      throw error;
    }
  }

  try {
    console.log("Starting conversation flow");
    await processMessage("Hi, I'd like to book an appointment");
    await processMessage("I'm a new patient");
    await processMessage("John Smith, 01/15/1980, (555) 123-4567");
    await processMessage("I need a general checkup");
    await processMessage("Yes, I have Blue Cross Blue Shield");
    await processMessage("Monday at 10:00 AM works for me");

    console.log("Final conversation:", conversation);
    return c.json(conversation);
  } catch (error) {
    console.error("Error in evalNewPatientBookingFlow:", error);
    throw error;
  }
}

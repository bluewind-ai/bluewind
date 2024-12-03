// app/functions/eval-new-patient-booking-flow.ts

import { chat } from "~/functions/chat.server";

export async function evalNewPatientBookingFlow(c: any) {
  const conversation = [];

  async function processMessage(input: string) {
    const modifiedContext = {
      ...c,
      req: {
        ...c.req,
        text: () => Promise.resolve(input),
      },
    };
    const response = await chat(modifiedContext);
    const responseJson = await response.json();
    conversation.push(
      { role: "patient", message: input },
      { role: "ai", message: responseJson.response },
    );
    return responseJson.response;
  }

  await processMessage("Hi, I'd like to book an appointment");
  await processMessage("I'm a new patient");
  await processMessage("John Smith, 01/15/1980, (555) 123-4567");
  await processMessage("I need a general checkup");
  await processMessage("Yes, I have Blue Cross Blue Shield");
  await processMessage("Monday at 10:00 AM works for me");

  return c.json(conversation);
}

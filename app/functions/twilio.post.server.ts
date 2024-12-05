
// app/functions/twilio.post.server.ts

import { z } from "zod";

export const twilioInputSchema = z.object({});
export const twilioOutputSchema = z.object({
  message: z.string(),
});
export type TwilioInput = z.infer<typeof twilioInputSchema>;
export type TwilioOutput = z.infer<typeof twilioOutputSchema>;
export async function twilio(c: any, input: TwilioInput): Promise<TwilioOutput> {
  return { message: "Hello from Twilio!" };
}

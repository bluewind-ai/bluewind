// app/functions/twilio.post.server.ts

import { z } from "zod";

if (!process.env.TWILIO_ACCOUNT_SID) throw new Error("TWILIO_ACCOUNT_SID required");
if (!process.env.TWILIO_AUTH_TOKEN) throw new Error("TWILIO_AUTH_TOKEN required");

export const twilioInputSchema = z.object({
  to: z.string().min(1),
  body: z.string().min(1),
  from: z.string().min(1),
});

export const twilioOutputSchema = z.object({
  success: z.boolean(),
  response: z.any().optional(),
  error: z.any().optional(),
});

export type TwilioInput = z.infer<typeof twilioInputSchema>;
export type TwilioOutput = z.infer<typeof twilioOutputSchema>;

export async function twilio(c: any, input: TwilioInput): Promise<TwilioOutput> {
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`,
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: input.to,
          From: input.from,
          Body: input.body,
        }).toString(),
      },
    );

    const data = await response.json();
    return {
      success: response.ok,
      response: data,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}

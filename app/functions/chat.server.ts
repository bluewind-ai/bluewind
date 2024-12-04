// app/functions/chat.server.ts
import { z } from "zod";

export const chatInputSchema = z
  .object({
    input: z.string(),
    requestId: z.string().optional(),
  })
  .strict();
export const chatOutputSchema = z
  .object({
    response: z.string(),
    requestId: z.string(),
  })
  .strict();
export type ChatInput = z.infer<typeof chatInputSchema>;
export type ChatOutput = z.infer<typeof chatOutputSchema>;
export async function chat(_c: any, input: ChatInput): Promise<ChatOutput> {
  const responses = {
    "Hi, I'd like to book an appointment": "Welcome! Are you a new patient or an existing patient?",
    "I'm a new patient":
      "I'll help you get set up. Could you please provide your full name, date of birth, and phone number?",
    "John Smith, 01/15/1980, (555) 123-4567":
      "Thank you! What type of service are you looking to book today? We offer general checkups, dental cleaning, and specialized treatments.",
    "I need a general checkup": "Do you have insurance you'd like us to verify?",
    "Yes, I have Blue Cross Blue Shield":
      "Great! I found the following available slots for a general checkup:\n- Monday, Dec 4th at 10:00 AM\n- Tuesday, Dec 5th at 2:30 PM\n- Wednesday, Dec 6th at 9:15 AM\nWhich time works best for you?",
    "Monday at 10:00 AM works for me":
      "Perfect! I've booked your appointment for Monday, December 4th at 10:00 AM. You'll receive a confirmation email shortly with all the details. Please arrive 15 minutes early to complete any remaining paperwork. Is there anything else you need help with?",
  };
  return {
    response: responses[input.input] || "I'm sorry, I didn't understand that.",
    requestId: input.requestId || crypto.randomUUID(),
  };
}

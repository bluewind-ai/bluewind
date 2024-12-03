// app/functions/twilio.get.server.ts

export async function twilio(c: any) {
  return c.json({ message: "Hello from Twilio!" });
}

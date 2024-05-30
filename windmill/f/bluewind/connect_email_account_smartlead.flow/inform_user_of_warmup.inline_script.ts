import * as wmill from "npm:windmill-client@^1.158.2";

export async function main(email_account_just_created: string) {
  // if no argument is passed, if user is logged in, it will use the user's username
  const resumeUrls = await wmill.getResumeUrls("approver1");

  return {
    resume: resumeUrls["resume"],
    default_args: {
      instructions:
        `Congrats the email account ${email_account_just_created} is now connected to smartlead. We will now warmup this inbox. This process involves sending emails to a warm up network before sending it to your prospects, in order to increase your deliverability.`,
    },
  };
}

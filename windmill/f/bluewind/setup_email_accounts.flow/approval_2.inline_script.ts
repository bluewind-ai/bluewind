import * as wmill from "npm:windmill-client@^1.158.2";

export async function main(email_just_created: string) {
  // if no argument is passed, if user is logged in, it will use the user's username
  const resumeUrls = await wmill.getResumeUrls("approver1");

  return {
    resume: resumeUrls["resume"],
    default_args: {
      instructions:
        `Congrats! you just created the email account ${email_just_created}. `,
    },
  };
}

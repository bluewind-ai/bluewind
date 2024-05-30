import * as wmill from "npm:windmill-client@^1.158.2";

export async function main(
  email_just_created_1: string,
  email_just_created_2: string,
) {
  const resumeUrls = await wmill.getResumeUrls("approver1");

  return {
    resume: resumeUrls["resume"],
    default_args: {
      instructions: `Congrats! you just created the an email account.`,
    },
  };
}

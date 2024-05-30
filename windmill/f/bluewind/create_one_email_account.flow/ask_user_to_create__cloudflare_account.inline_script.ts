import * as wmill from "npm:windmill-client@^1.158.2";

export async function main() {
  // if no argument is passed, if user is logged in, it will use the user's username
  const resumeUrls = await wmill.getResumeUrls("approver1");

  // send the resumeUrls to the recipient or see Prompt section above

  return {
    resume: resumeUrls["resume"],
    default_args: {
      instructions:
        "You don't have any email accounts. Let's create 1 email account to start with. First, create a cloudflare account, it's free: https://dash.cloudflare.com/sign-up",
    },
  };
}

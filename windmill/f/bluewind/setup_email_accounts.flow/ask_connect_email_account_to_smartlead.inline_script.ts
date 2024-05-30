import * as wmill from "npm:windmill-client@^1.158.2";

export async function main() {
  // if no argument is passed, if user is logged in, it will use the user's username
  const resumeUrls = await wmill.getResumeUrls("approver1");

  return {
    resume: resumeUrls["resume"],
    default_args: {
      instructions:
        `Great! now let's connect this email account to smartlead: https://www.youtube.com/watch?v=gYLCkraRT4E`,
    },
  };
}

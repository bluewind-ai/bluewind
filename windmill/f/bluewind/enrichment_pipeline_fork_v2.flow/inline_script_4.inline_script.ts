//this assumes the Form tab has a string field named "foo" and a checkbox named "bar"

import * as wmill from "npm:windmill-client@^1.158.2";

export async function main(
  subject_line: string,
  body: string,
  linkedin_url: string,
  email: string,
) {
  // if no argument is passed, if user is logged in, it will use the user's username
  const resumeUrls = await wmill.getResumeUrls("approver1");

  // send the resumeUrls to the recipient or see Prompt section above

  return {
    resume: resumeUrls["resume"],
    default_args: {
      subject_line,
      body,
      linkedin_url,
      email,
    },
  };
}

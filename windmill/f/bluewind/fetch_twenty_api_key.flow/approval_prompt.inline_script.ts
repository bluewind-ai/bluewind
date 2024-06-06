//this assumes the Form tab has a string field named "foo" and a checkbox named "bar"

import * as wmill from "npm:windmill-client@^1.158.2";

export async function main() {
  // if no argument is passed, if user is logged in, it will use the user's username
  const resumeUrls = await wmill.getResumeUrls("approver1");

  // send the resumeUrls to the recipient or see Prompt section above

  return {
    resume: resumeUrls["resume"],
    default_args: {
      twenty_api_key: "YOUR_TWENTY_API_KEY",
      twenty_base_url: "https://api.twenty.com",
    }, // optional
  };
}

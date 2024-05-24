//this assumes the Form tab has a string field named "foo"

import * as wmill from "npm:windmill-client@^1.158.2";

export async function main() {
  // if no argument is passed, if user is logged in, it will use the user's username
  const resumeUrls = await wmill.getResumeUrls("approver1");
  //push element to flatten list
  // send the resumeUrls to the recipient or see Prompt section above

  return {
    enums: {
      pick_an_action: [
        "Create new campaign",
        "Continue a campaign",
        "Add leads to campaign",
      ],
    },
  };
}

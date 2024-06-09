//this assumes the Form tab has a string field named "foo" and a checkbox named "bar"

import * as wmill from "npm:windmill-client@^1.158.2";

export async function main() {
  // if no argument is passed, if user is logged in, it will use the user's username
  const resumeUrls = await wmill.getResumeUrls("approver1");

  // send the resumeUrls to the recipient or see Prompt section above

  return {
    default_args: {
      instructions:`1- Please go the link below and filter until the people roughly match your target audience.
2- Put the new link in the new_search_link field
3- Click Resume`,
      go_to_link:
        "https://app.apollo.io/#/people?finderViewId=5b6dfc5a73f47568b2e5f11c",
      new_search_link: "PUT_APOLLO_LINK_HERE",
    },
    resume: resumeUrls["resume"],
  };
}

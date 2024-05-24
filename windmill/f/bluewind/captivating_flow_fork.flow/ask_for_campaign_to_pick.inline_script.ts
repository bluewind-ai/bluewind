//this assumes the Form tab has a string field named "foo"

import * as wmill from "npm:windmill-client@^1.158.2";

export async function main(lists: Array) {
  // if no argument is passed, if user is logged in, it will use the user's username
  const resumeUrls = await wmill.getResumeUrls("approver1");
  const flattenedList: string[] = lists.map((list) => list.name);
  //push element to flatten list
  // send the resumeUrls to the recipient or see Prompt section above

  return {
    enums: {
      campaign_name: flattenedList,
    },
  };
}

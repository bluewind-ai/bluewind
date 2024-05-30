import * as wmill from "npm:windmill-client@^1.158.2";

export async function main(domain_name_just_created: string) {
  // if no argument is passed, if user is logged in, it will use the user's username
  const resumeUrls = await wmill.getResumeUrls("approver1");

  // send the resumeUrls to the recipient or see Prompt section above

  return {
    resume: resumeUrls["resume"],
    default_args: {
      instructions:
        `Create a google workspace for the domain ${domain_name_just_created}. You will want to create 2 email accounts. For example firstname@${domain_name_just_created} and firstname.lastname@${domain_name_just_created}. To create the google workspace, follow this tutorial: https://www.youtube.com/watch?v=J57AfSLIt80`,
    },
  };
}

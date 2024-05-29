import * as wmill from "npm:windmill-client@^1.158.2";

export async function main(domain_name_to_buy: string) {
  // if no argument is passed, if user is logged in, it will use the user's username
  const resumeUrls = await wmill.getResumeUrls("approver1");

  // send the resumeUrls to the recipient or see Prompt section above

  return {
    resume: resumeUrls["resume"],
    default_args: {
      instructions:
        `Buy the domain name ${domain_name_to_buy} by following these instructions: https://www.loom.com/share/78ec0b2b16ec4b97a67f09986340a4dc`,
    },
  };
}

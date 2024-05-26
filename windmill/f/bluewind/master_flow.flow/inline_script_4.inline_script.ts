import * as wmill from "npm:windmill-client@^1.158.2";

export async function main() {
  // if no argument is passed, if user is logged in, it will use the user's username
  const resumeUrls = await wmill.getResumeUrls("approver1");

  // send the resumeUrls to the recipient or see Prompt section above

  return {
    resume: resumeUrls["resume"],
    default_args: {
      instructions:
        "Please copy paste the JSON in an code editor and modify it for your campaign",
      campaign_info: {
        "sender_company_name": "Bluewind",
        "custom_subject_lines": [
          "Bluewind pre-seed",
        ],
        "sender_company_domain_name": "bluewind(.)ai",
        "sender_first_name": "Wayne",
        "sender_last_name": "Hamadi",
        "custom_taglines": [
          "open-source go-to-market assistant",
          "free go-to-market assistant",
        ],
        "block_1": "Bluewind is raising a pre-seed. 100k at 5M.",
        "block_2": `About Bluewind:
- open-source go-to-market assistant to generate leads.
- my customers were overwhelmed by all the GTM tools and wasted time and money trying all of them.
- Instead of creating another tool we created an assistant that connects all the best SaaS together to generate leads for them.
- about me: ex AutoGPT, AI Agent expert(author of paper published at Neurips), and famous Growth Hacker.`,
        "block_3":
          "Would you like me to send you the deck? I don't send it directly because of deliverability.",
        "block_4": "",
        "block_5": "",
      },
    },
  };
}

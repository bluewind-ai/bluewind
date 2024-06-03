import * as wmill from "windmill-client";

export async function main() {
  const resumeUrls = await wmill.getResumeUrls("approver1");

  return {
    resume: resumeUrls["resume"],
    default_args: {
      instructions: "YOU ARE ABOUT TO REMOVE EVERYTHING IN TWENTY !!!",
    }, // optional
    enums: {}, // optional
  };
}
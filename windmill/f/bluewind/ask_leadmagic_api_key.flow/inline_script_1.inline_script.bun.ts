import * as wmill from "windmill-client"
        
export async function main() {
    const resumeUrls = await wmill.getResumeUrls("approver1")

    return {
        resume: resumeUrls['resume'],
        default_args: {
          leadmagic_api_key: "YOUR_LEADMAGIC_API_KEY"
        }, // optional
        enums: {} // optional
    }
}
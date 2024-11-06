// scripts/generate-instructions.ts

import fetch from "node-fetch";

interface InstructionsResponse {
  content: string;
}

async function generateInstructions() {
  const response = await fetch("http://localhost:5173/api/templates/instructions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const data: InstructionsResponse = (await response.json()) as InstructionsResponse;
  console.log(data.content);
}

generateInstructions();

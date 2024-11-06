// scripts/generate-instructions.ts

import fetch from "node-fetch";

async function generateInstructions(fileCount?: number) {
  const response = await fetch("http://localhost:5173/api/templates/instructions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileCount }),
  });

  const { content } = await response.json();
  console.log(content);
}

generateInstructions(1);

// scripts/get-first-prompt.ts

import fetch from "node-fetch";

async function getFirstPrompt(fileCount?: number) {
  const response = await fetch("http://localhost:5173/api/templates/get-first-prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileCount }),
  });

  const { content } = await response.json();
  console.log(content);
}

getFirstPrompt(1);

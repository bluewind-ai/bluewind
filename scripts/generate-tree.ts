// scripts/generate-tree.ts

import fetch from "node-fetch";

interface TreeResponse {
  content: string;
}

async function generateTree() {
  const response = await fetch("http://localhost:5173/api/templates/tree", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const { content } = (await response.json()) as TreeResponse;
  console.log(content);
}

generateTree();

// app/routes/api.templates.get-first-prompt.tsx

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { action as instructionsAction } from "./api.templates.instructions";
import { action as treeAction } from "./api.templates.tree";

export async function action({ request }: ActionFunctionArgs) {
  // We need to clone the request since it can only be used once
  const reqClone1 = request.clone();
  const reqClone2 = request.clone();

  const instructions = await (
    await instructionsAction({ request: reqClone1 } as ActionFunctionArgs)
  ).json();
  const tree = await (await treeAction({ request: reqClone2 } as ActionFunctionArgs)).json();

  const content = `${instructions.content}\n\nCurrent project structure:\n\n${tree.content}`;

  return json({ content });
}

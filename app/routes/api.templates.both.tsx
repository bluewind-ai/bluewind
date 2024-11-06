// app/routes/api.templates.both.tsx

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { action as instructionsAction } from "./api.templates.instructions";
import { action as treeAction } from "./api.templates.tree";

export async function action({ request }: ActionFunctionArgs) {
  const instructionsResult = await instructionsAction({ request } as ActionFunctionArgs);
  const treeResult = await treeAction({ request } as ActionFunctionArgs);

  const instructionsData = await instructionsResult.json();
  const treeData = await treeResult.json();

  const content = `${instructionsData.content}\n\nCurrent project structure:\n\n${treeData.content}`;

  return json({ content });
}

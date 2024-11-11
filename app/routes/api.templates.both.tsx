// app/routes/api.templates.both.tsx

import { type ActionFunctionArgs } from "@remix-run/node";
import { action as instructionsAction } from "./api.templates.instructions";
import { action as treeAction } from "./api.templates.tree";
import { beforeAction } from "~/lib/middleware";

// eslint-disable-next-line unused-imports/no-unused-vars
async function _action(args: ActionFunctionArgs) {
  const instructionsResult = await instructionsAction(args);
  const treeResult = await treeAction(args);

  const instructionsData = await instructionsResult.json();
  const treeData = await treeResult.json();

  const content = `${instructionsData.content}\n\nCurrent project structure:\n\n${treeData.content}`;

  return { content };
}

export async function action(args: ActionFunctionArgs) {
  await beforeAction(args);
  return await _action(args);
}

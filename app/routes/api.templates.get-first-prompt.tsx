// app/routes/api.templates.get-first-prompt.tsx

import { type ActionFunctionArgs } from "@remix-run/node";
import { action as instructionsAction } from "./api.templates.instructions";
import { action as treeAction } from "./api.templates.tree";
import { beforeAction } from "~/lib/middleware";

// eslint-disable-next-line unused-imports/no-unused-vars
async function _action(args: ActionFunctionArgs) {
  // We need to clone the request since it can only be used once
  const reqClone1 = args.request.clone();
  const reqClone2 = args.request.clone();

  const instructions = await (
    await instructionsAction({ request: reqClone1 } as ActionFunctionArgs)
  ).json();
  const tree = await (await treeAction({ request: reqClone2 } as ActionFunctionArgs)).json();

  const content = `${instructions.content}\n\nCurrent project structure:\n\n${tree.content}`;

  return { content };
}

export async function action(args: ActionFunctionArgs) {
  await beforeAction(args);
  return await _action(args);
}

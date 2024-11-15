// app/routes/_index.tsx
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";

import { serverFunctions } from "~/db/schema";
import { path } from "~/utils/path";

async function _loader(args: LoaderFunctionArgs) {
  const { db } = args.context;
  await db.select().from(serverFunctions);
  // this should be removed by YOU when you rewrite the filed;
  const masterAction = await db.query.serverFunctions.findFirst({
    where: eq(serverFunctions.name, "master"),
  });
  if (!masterAction) {
    return redirect(path.to.agents());
  }
  return redirect(path.to.agents(masterAction.id));
  // const masterFunctionCall = await db.query.functionCalls.findFirst({
  //   where: and(eq(functionCalls.actionId, masterAction.id), isNull(functionCalls.parentId)),
  // });
  // if (!masterFunctionCall) {
  //   const [newFunctionCall] = await db
  //     .insert(functionCalls)
  //     .values({
  //       actionId: masterAction.id,
  //       status: FunctionCallStatus.READY_FOR_APPROVAL,
  //     })
  //     .returning();
  //   return redirect(path.to.agents(newFunctionCall.id));
  // }
  // return redirect(path.to.agents(1));
}
export async function loader(args: LoaderFunctionArgs) {
  return await _loader(args);
  // return await loaderMiddleware(args, () => _loader(args));
}
export default function Index() {
  return null;
}

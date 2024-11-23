// app/functions/bootstrap.server.ts

import {
  functionCalls,
  FunctionCallStatus,
  serverFunctions,
  ServerFunctionType,
} from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function bootstrap(extensions: RequestExtensions) {
  const [masterAction] = await extensions.db
    .insert(serverFunctions)
    .values({
      requestId: extensions.requestId,
      name: "master",
      type: ServerFunctionType.SYSTEM,
    })
    .returning();

  await extensions.db
    .insert(functionCalls)
    .values({
      requestId: extensions.requestId,
      serverFunctionId: masterAction.id,
      status: FunctionCallStatus.READY_FOR_APPROVAL,
    })
    .returning();

  console.log("📊 Queries after inserts:", extensions.queries);
}

// app/functions/bootstrap.server.ts
import { functionCalls, serverFunctions } from "~/db/schema";
import { FunctionCallStatus } from "~/db/schema/function-calls/schema";
import { ServerFunctionType } from "~/db/schema/server-functions/schema";
import type { ExtendedContext } from "~/middleware";

export async function bootstrap(extensions: ExtendedContext) {
  const [masterAction] = await extensions.db
    .insert(serverFunctions)
    .values({
      requestId: extensions.requestId,
      name: "master",
      type: ServerFunctionType.SYSTEM,
      functionCallId: 1, // Added this required field - root server function
    })
    .returning();
  await extensions.db
    .insert(functionCalls)
    .values({
      requestId: extensions.requestId,
      serverFunctionId: masterAction.id,
      functionCallId: 1, // First function call is root
      status: FunctionCallStatus.READY_FOR_APPROVAL,
    })
    .returning();
}

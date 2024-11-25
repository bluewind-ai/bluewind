// app/functions/load-server-functions.server.ts
import * as schema from "~/db/schema";
import { ServerFunctionType } from "~/db/schema/server-functions/schema";
import type { ExtendedContext } from "~/middleware";

const CORE_SERVER_FUNCTIONS = [
  {
    name: "truncateDb",
    label: "Truncate DB",
    variant: "destructive",
    type: ServerFunctionType.SYSTEM,
  },
  {
    name: "bootstrap",
    label: "Bootstrap",
    variant: "default",
    type: ServerFunctionType.SYSTEM,
  },
  {
    name: "updateFiles",
    label: "Update Files",
    variant: "default",
    type: ServerFunctionType.SYSTEM,
  },
  {
    name: "generateRoutes",
    label: "Generate Routes",
    variant: "default",
    type: ServerFunctionType.SYSTEM,
  },
  {
    name: "loadNavigationData",
    label: "Load Navigation Data",
    variant: "default",
    type: ServerFunctionType.SYSTEM,
  },
  {
    name: "goNext",
    label: "Go Next",
    variant: "default",
    type: ServerFunctionType.SYSTEM,
  },
] as const;
export async function loadServerFunctions(request: ExtendedContext) {
  const insertPromises = CORE_SERVER_FUNCTIONS.map((fn) => {
    return request.db
      .insert(schema.serverFunctions)
      .values({
        name: fn.name,
        type: fn.type,
        requestId: request.requestId,
        metadata: {
          label: fn.label,
          variant: fn.variant,
        },
      } as any) // temporary fix while we update the schema
      .onConflictDoUpdate({
        target: schema.serverFunctions.name,
        set: {
          type: fn.type,
          requestId: request.requestId,
          metadata: {
            label: fn.label,
            variant: fn.variant,
          },
        } as any,
      });
  });
  await Promise.all(insertPromises);
  return {
    status: "success",
    message: `Loaded ${CORE_SERVER_FUNCTIONS.length} server functions`,
    functions: CORE_SERVER_FUNCTIONS,
  };
}

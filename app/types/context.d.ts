// app/types/context.d.ts
import { ServerContext } from "remix-create-express-app/context";

import { type DbClient } from "~/db/db-client"; // Add this import

declare module "@remix-run/server-runtime" {
  export interface AppLoadContext extends ServerContext {
    sayHello: () => string;
    db: DbClient;
  }
}

export {};

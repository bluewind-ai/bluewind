// app/types/context.d.ts
import { ServerContext } from "remix-create-express-app/context";

declare module "@remix-run/server-runtime" {
  export interface AppLoadContext extends ServerContext {
    sayHello: () => string;
    db: DbClient;
  }
}

export {};

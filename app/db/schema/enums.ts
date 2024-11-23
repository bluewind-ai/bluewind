// app/db/schema/enums.ts

import { pgEnum } from "drizzle-orm/pg-core";

import { TableModel } from "./table-models";

export const modelEnum = pgEnum("model", [
  TableModel.USERS,
  TableModel.SESSIONS,
  TableModel.SERVER_FUNCTIONS,
  TableModel.FUNCTION_CALLS,
  TableModel.REQUEST_ERRORS,
  TableModel.DEBUG_LOGS,
  TableModel.OBJECTS,
  TableModel.REQUESTS,
  TableModel.MODELS,
]);

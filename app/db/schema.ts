// app/db/schema.ts

import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { type AnyPgColumn } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export enum ActionType {
  SYSTEM = "system",
  USER = "user",
  WORKFLOW = "workflow",
}

export enum FunctionCallStatus {
  READY_FOR_APPROVAL = "ready_for_approval",
  RUNNING = "running",
  COMPLETED = "completed",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function enumToPgEnum<T extends Record<string, any>>(
  myEnum: T,
): [T[keyof T], ...T[keyof T][]] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.values(myEnum).map((value: any) => `${value}`) as any;
}

export const actionTypeEnum = pgEnum("action_type", enumToPgEnum(ActionType));
export const functionCallStatusEnum = pgEnum(
  "function_call_status",
  enumToPgEnum(FunctionCallStatus),
);

export const objects = pgTable("objects", {
  id: serial("id").primaryKey(),
  model: text("model").notNull(),
  recordId: integer("record_id").notNull(),
});

export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  value: varchar("value", { length: 50 }).notNull().unique(),
  label: varchar("label", { length: 50 }).notNull(),
  iconKey: varchar("icon_key", { length: 50 }).notNull(),
  order: integer("order").notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(), // for authentication
  csrfToken: text("csrf_token").notNull(), // for CSRF protection
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  messages: jsonb("messages").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull().unique(),
  type: actionTypeEnum("type").notNull(),
});

export type Action = typeof actions.$inferSelect & {
  displayName: string;
};

export function enrichAction(action: typeof actions.$inferSelect): Action {
  return {
    ...action,
    displayName: action.name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  };
}

export const functionCalls = pgTable("function_calls", {
  id: serial("id").primaryKey(),
  actionId: integer("action_id")
    .references(() => actions.id, { onDelete: "cascade" })
    .notNull(),
  parentId: integer("parent_id").references((): AnyPgColumn => functionCalls.id, {
    onDelete: "cascade",
  }),
  status: functionCallStatusEnum("status").notNull().default(FunctionCallStatus.READY_FOR_APPROVAL),
  args: jsonb("args"),
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const functionCallsRelations = relations(functionCalls, ({ one }) => ({
  action: one(actions, {
    fields: [functionCalls.actionId],
    references: [actions.id],
  }),
  parent: one(functionCalls, {
    fields: [functionCalls.parentId],
    references: [functionCalls.id],
  }),
}));

export const actionsRelations = relations(actions, ({ many }) => ({
  calls: many(functionCalls),
}));

export const requestErrors = pgTable("request_errors", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  url: text("url").notNull(),
  headers: jsonb("headers").$type<Record<string, string>>(),
  body: text("body"),
  stack: text("stack"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const debugLogs = pgTable("debug_logs", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

type TableConfig = {
  displayName: string;
  urlName: string;
};

export const TABLES: Record<string, TableConfig> = {
  users: {
    displayName: "Users",
    urlName: "users",
  },
  sessions: {
    displayName: "Sessions",
    urlName: "sessions",
  },
  actions: {
    displayName: "Actions",
    urlName: "actions",
  },
  functionCalls: {
    displayName: "Function Calls",
    urlName: "function-calls",
  },
  requestErrors: {
    displayName: "Request Errors",
    urlName: "request-errors",
  },
  debugLogs: {
    displayName: "Debug Logs",
    urlName: "debug-logs",
  },
  objects: {
    displayName: "Objects",
    urlName: "objects",
  },
};

export function getTableMetadata() {
  return Object.entries(TABLES).map(([key, config]) => ({
    name: key,
    ...config,
  }));
}

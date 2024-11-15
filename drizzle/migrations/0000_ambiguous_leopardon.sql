CREATE TYPE "public"."function_call_status" AS ENUM('READY_FOR_APPROVAL', 'APPROVED', 'REJECTED', 'RUNNING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."model" AS ENUM('users', 'sessions', 'server-functions', 'function-calls', 'request-errors', 'debug-logs', 'objects', 'requests');--> statement-breakpoint
CREATE TYPE "public"."server_function_type" AS ENUM('SYSTEM', 'USER');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apps" (
	"id" serial PRIMARY KEY NOT NULL,
	"value" varchar(50) NOT NULL,
	"label" varchar(50) NOT NULL,
	"icon_key" varchar(50) NOT NULL,
	"order" integer NOT NULL,
	"function_call_id" integer NOT NULL,
	CONSTRAINT "apps_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "debug_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"function_call_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "function_calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_function_id" integer NOT NULL,
	"request_id" integer NOT NULL,
	"parent_id" integer,
	"status" "function_call_status" DEFAULT 'READY_FOR_APPROVAL' NOT NULL,
	"args" jsonb,
	"result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "objects" (
	"id" integer PRIMARY KEY NOT NULL,
	"model" "model" NOT NULL,
	"record_id" integer NOT NULL,
	"function_call_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "request_errors" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"method" varchar(10) NOT NULL,
	"url" text NOT NULL,
	"headers" jsonb,
	"body" text,
	"stack" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"function_call_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "requests" (
	"id" serial PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "server_functions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"type" "server_function_type" NOT NULL,
	"request_id" integer NOT NULL,
	"function_call_id" integer,
	CONSTRAINT "server_functions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_token" text NOT NULL,
	"csrf_token" text NOT NULL,
	"user_id" integer NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"function_call_id" integer NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"function_call_id" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apps" ADD CONSTRAINT "apps_function_call_id_function_calls_id_fk" FOREIGN KEY ("function_call_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "debug_logs" ADD CONSTRAINT "debug_logs_function_call_id_function_calls_id_fk" FOREIGN KEY ("function_call_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "function_calls" ADD CONSTRAINT "function_calls_server_function_id_server_functions_id_fk" FOREIGN KEY ("server_function_id") REFERENCES "public"."server_functions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "function_calls" ADD CONSTRAINT "function_calls_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "function_calls" ADD CONSTRAINT "function_calls_parent_id_function_calls_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "request_errors" ADD CONSTRAINT "request_errors_function_call_id_function_calls_id_fk" FOREIGN KEY ("function_call_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "server_functions" ADD CONSTRAINT "server_functions_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "server_functions" ADD CONSTRAINT "server_functions_function_call_id_function_calls_id_fk" FOREIGN KEY ("function_call_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_function_call_id_function_calls_id_fk" FOREIGN KEY ("function_call_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_function_call_id_function_calls_id_fk" FOREIGN KEY ("function_call_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

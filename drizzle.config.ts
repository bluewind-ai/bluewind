// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./app/db/schema/index.ts", // Changed from schema.ts to schema/index.ts
  out: "./drizzle/migrations", // More specific path
  dialect: "postgresql", // Changed back to 'postgresql'
  dbCredentials: {
    host: process.env.DB_HOST!,
    user: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    port: parseInt(process.env.DB_PORT!),
  },
} satisfies Config;

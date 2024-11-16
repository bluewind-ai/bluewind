// scripts/truncate-db.ts

import { db } from "~/middleware/main";

async function truncateAllTables() {
  // Execute the truncate command
  const command = `
    DO $$
    DECLARE
      tables text;
    BEGIN
      SELECT string_agg('"' || tablename || '"', ',')
      INTO tables
      FROM pg_tables
      WHERE schemaname = 'public';

      IF tables IS NOT NULL THEN
        EXECUTE 'TRUNCATE TABLE ' || tables || ' CASCADE';
      END IF;
    END $$;
  `;

  await db.execute(command);
  console.log("All tables truncated.");
}

truncateAllTables().catch(console.error);

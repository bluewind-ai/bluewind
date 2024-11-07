// app/routes/actions.load-actions/route.tsx

import { json, type ActionFunction } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { withActionMiddleware } from "~/lib/action-middleware.server";
import { db } from "~/db";
import { actions } from "~/db/schema";
import fs from "node:fs/promises";
import path from "node:path";

const loadActionsAction = async () => {
  console.log("Starting loadActionsAction");

  // Get all .ts files from the actions directory
  const actionsDir = path.join(process.cwd(), "app", "actions");
  console.log("Actions directory:", actionsDir);

  const files = await fs.readdir(actionsDir);
  console.log("Found files:", files);

  const actionFiles = files.filter((file) => file.endsWith(".server.ts"));
  console.log("Action files:", actionFiles);

  // Extract action names and sync with database
  const actionNames = actionFiles.map((file) => path.basename(file, ".server.ts"));
  console.log("Action names:", actionNames);

  const results = [];

  for (const name of actionNames) {
    // Check if action exists
    const existing = await db.query.actions.findFirst({
      where: (fields, { eq }) => eq(fields.name, name),
    });

    // If not, create it
    if (!existing) {
      const newAction = await db.insert(actions).values({ name }).returning();
      results.push({ name, status: "created" });
    } else {
      results.push({ name, status: "exists" });
    }
  }

  return json({
    success: true,
    actionsFound: actionNames,
    results,
  });
};

export const action = withActionMiddleware(loadActionsAction);

export default function LoadActionsAction() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="p-4">
      <Form method="post">
        <Button type="submit">Load Actions</Button>
      </Form>
      {actionData && (
        <pre className="mt-4 p-4 bg-slate-100 rounded">{JSON.stringify(actionData, null, 2)}</pre>
      )}
    </div>
  );
}

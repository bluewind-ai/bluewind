// app/routes/actions.master/route.tsx

import { json, type ActionFunction, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { withActionMiddleware } from "~/lib/action-middleware.server";

const masterAction = async (_args: ActionFunctionArgs) => {
  return json({ success: true });
};

export const action = withActionMiddleware(masterAction);

export default function MasterAction() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Master Action</h2>
      <Form method="post">
        <Button type="submit">Run Master Action</Button>
      </Form>
      {actionData && (
        <pre className="mt-4 p-4 bg-slate-100 rounded">{JSON.stringify(actionData, null, 2)}</pre>
      )}
    </div>
  );
}

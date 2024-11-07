// app/routes/actions.$name/route.tsx

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useParams } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { withActionMiddleware } from "~/lib/action-middleware.server";
import { goNext } from "~/actions/go-next.server";
import { loadCsvData } from "~/actions/load-csv-data.server";
import { master } from "~/actions/master.server";

const actions = {
  "go-next": goNext,
  "load-csv-data": loadCsvData,
  master,
} as const;

const runAction = async ({ request, params }: ActionFunctionArgs) => {
  console.log("Running action with params:", params);
  console.log("Available actions:", Object.keys(actions));
  const actionName = params.name;
  console.log("Looking for action:", actionName);
  const action = actions[actionName as keyof typeof actions];
  console.log("Found action?", !!action);

  return action(request);
};

export const action = withActionMiddleware(runAction);

export default function ActionRunner() {
  const { name } = useParams();
  console.log("Component rendered with name:", name);
  const actionData = useActionData<typeof action>();

  return (
    <div className="p-4">
      <Form method="post">
        <Button type="submit">
          {name!
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        </Button>
      </Form>
      {actionData && (
        <pre className="mt-4 p-4 bg-slate-100 rounded">{JSON.stringify(actionData, null, 2)}</pre>
      )}
    </div>
  );
}

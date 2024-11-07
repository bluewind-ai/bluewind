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
  const actionName = params.name;
  const action = actions[actionName as keyof typeof actions];

  return action(request);
};

export const action = withActionMiddleware(runAction);

export default function ActionRunner() {
  const { name } = useParams();
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

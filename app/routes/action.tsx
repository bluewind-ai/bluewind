// app/routes/action.tsx

import { type ActionFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { actions } from "~/lib/generated/actions";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionName = formData.get("actionName") as keyof typeof actions;

  if (!actionName || !(actionName in actions)) {
    throw new Response(`Action ${actionName} not found`, { status: 404 });
  }

  const selectedAction = actions[actionName];
  const result = await selectedAction();

  return json({ status: "success", result });
}

export default function ActionPage() {
  const [searchParams] = useSearchParams();
  const actionName = searchParams.get("action") ?? "load-csv-data";
  const actionData = useActionData<typeof action>();

  return (
    <div className="p-4">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {Object.keys(actions).map((name) => (
            <Form method="post" key={name}>
              <input type="hidden" name="actionName" value={name} />
              <Button type="submit" variant={actionName === name ? "default" : "outline"}>
                {name
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </Button>
            </Form>
          ))}
        </div>

        {actionData && (
          <div className="bg-slate-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Action Result</h2>
            <pre>{JSON.stringify(actionData, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

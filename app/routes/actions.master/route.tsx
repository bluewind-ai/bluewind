// app/routes/actions.master/route.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
import { json, type ActionFunction, type ActionFunctionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";

type Context = {
  startTime?: number;
};

export function withActionMiddleware(
  action: ActionFunction,
  context: Context = {},
): ActionFunction {
  return async (args) => {
    return await db.transaction(async (tx) => {
      const actionName = action.name;

      const actionCall = await tx.query.actionCalls.findMany({
        with: {
          action: true,
        },
        where: (fields, { eq }) =>
          eq(
            fields.actionId,
            tx
              .select({ id: actions.id })
              .from(actions)
              .where(eq(actions.name, actionName))
              .limit(1),
          ),
      });

      if (actionCall.length === 0) {
        const existingAction = await tx.query.actions.findFirst({
          where: (fields, { eq }) => eq(fields.name, actionName),
        });

        if (existingAction) {
          await tx
            .insert(actionCalls)
            .values({
              actionId: existingAction.id,
              status: "running",
            })
            .returning();
        }
      }

      context.startTime = Date.now();
      return await action(args);
    });
  };
}

const masterAction = async (_args: ActionFunctionArgs) => {
  return json({ success: true });
};

export const action = withActionMiddleware(masterAction);

export const loader = async () => {
  return json({ message: "Master action endpoint" });
};

export default function MasterAction() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Master Action</h2>
      <Form method="post">
        <Button type="submit">Run Master Action</Button>
      </Form>
    </div>
  );
}

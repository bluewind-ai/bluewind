// app/routes/action-calls/components/ActionCallDetails.tsx

import type { actionCalls, actions } from "~/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type ActionCallDetailsProps = {
  actionCall: InferSelectModel<typeof actionCalls>;
  action: InferSelectModel<typeof actions>;
};

export function ActionCallDetails({ actionCall, action }: ActionCallDetailsProps) {
  return (
    <div className="mb-4">
      <h1>Action Call {actionCall.id}</h1>
      <p>Action: {action.name}</p>
      <p>Status: {actionCall.status}</p>
    </div>
  );
}

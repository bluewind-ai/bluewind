// app/components/action-call-details.tsx

import type { functionCalls, actions } from "~/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type ActionCallDetailsProps = {
  functionCall: InferSelectModel<typeof functionCalls>;
  action: InferSelectModel<typeof actions>;
};

export function ActionCallDetails({ functionCall, action }: ActionCallDetailsProps) {
  return (
    <div className="mb-4">
      <h1>Action Call {functionCall.id}</h1>
      <p>Action: {action.name}</p>
      <p>Status: {functionCall.status}</p>
    </div>
  );
}

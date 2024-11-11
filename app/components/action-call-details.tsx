// app/components/action-call-details.tsx

import type { InferSelectModel } from "drizzle-orm";

import type { actions, functionCalls } from "~/db/schema";

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

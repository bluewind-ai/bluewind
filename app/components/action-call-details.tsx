// app/components/action-call-details.tsx
import type { InferSelectModel } from "drizzle-orm";

import type { functionCalls, serverFunctions } from "~/db/schema";

type ActionCallDetailsProps = {
  functionCall: InferSelectModel<typeof functionCalls>;
  action: InferSelectModel<typeof serverFunctions>;
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

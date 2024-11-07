// app/routes/actions.master/route.tsx

import { json, type ActionFunction } from "@remix-run/node";
import { loadCsvData } from "~/actions/load-csv-data.server";

export const action: ActionFunction = async (args) => {
  return await loadCsvData(args);
};

// Since this is also a GET endpoint, need a loader
export const loader = async () => {
  return json({ message: "Master action endpoint" });
};

// Need a default export for the route
export default function MasterAction() {
  return <div>Master Action</div>;
}

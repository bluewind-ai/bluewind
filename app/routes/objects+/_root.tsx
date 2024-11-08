// app/routes/objects+/_root.tsx

import { Outlet } from "@remix-run/react";

export default function ObjectsLayout() {
  return (
    <div className="h-full">
      <Outlet />
    </div>
  );
}

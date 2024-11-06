// app/components/ui/resizable.tsx

import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "~/lib/utils";
import { useRef } from "react";

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) => {
  void 0;
  const lastLogTime = useRef(Date.now());
  const resistancePointX = useRef<number | null>(null);
  const isResisting = useRef(false);

  const logEvent = (message: string, data: any) => {
    console.log(message, {
      ...data,
      resistancePointX: resistancePointX.current,
      isResisting: isResisting.current,
      time: new Date().toISOString(),
    });
  };

  return (
    <ResizablePrimitive.PanelResizeHandle
      className={cn(
        "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        className,
      )}
      onDragStart={(e) => {
        void 0;
        resistancePointX.current = null;
        isResisting.current = false;
      }}
      onDrag={(e) => {
        if (!e) return;
        void 0;
        const panel = document.querySelector("[data-panel-id]") as HTMLElement;
        const parent = panel?.parentElement as HTMLElement;

        if (panel && parent) {
          const rect = panel.getBoundingClientRect();
          const parentRect = parent.getBoundingClientRect();
          const percentage = (rect.width / parentRect.width) * 100;

          console.log("Dragging:", {
            percentage,
            width: rect.width,
            parentWidth: parentRect.width,
            mouseX: e.clientX,
            isResisting: isResisting.current,
            resistancePoint: resistancePointX.current,
          });

          if (percentage <= 15 && !isResisting.current) {
            void 0;
            resistancePointX.current = e.clientX;
            isResisting.current = true;
            panel.style.width = "15%";
          }

          if (isResisting.current && resistancePointX.current) {
            const distance = Math.abs(resistancePointX.current - e.clientX);
            console.log("In resistance zone:", {
              distance,
              mouseX: e.clientX,
              resistanceX: resistancePointX.current,
            });

            if (distance > 50) {
              void 0;
              panel.style.width = "0%";
              isResisting.current = false;
              resistancePointX.current = null;
            }
          }
        }
      }}
      onDragEnd={(e) => {
        void 0;
        resistancePointX.current = null;
        isResisting.current = false;
      }}
      {...props}
    >
      {withHandle && (
        <div
          className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border"
          onClick={() => void 0}
          onMouseEnter={() => void 0}
          onMouseLeave={() => void 0}
        >
          <DragHandleDots2Icon className="h-2.5 w-2.5" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
};

const ResizablePanelGroup = ResizablePrimitive.PanelGroup;

export { ResizablePanel, ResizableHandle, ResizablePanelGroup };

// app/components/ui/resizable.tsx

import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "~/lib/utils";

const ResizablePanel = ResizablePrimitive.Panel;

// Custom resize handle to implement the "pouf" behavior
const ResizableHandle = ({
  withHandle,
  className,
  onDragStart,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) => {
  let isDragging = false;
  let hasResisted = false;
  let startX = 0;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging = true;
    hasResisted = false;
    startX = e.clientX;
    document.body.style.cursor = "ew-resize";
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const panel = e.currentTarget.previousElementSibling as HTMLElement;
    if (!panel) return;

    const panelRect = panel.getBoundingClientRect();
    const parentRect = panel.parentElement!.getBoundingClientRect();
    const currentPercentage = (panelRect.width / parentRect.width) * 100;

    // Add resistance when below 15%
    if (currentPercentage <= 15) {
      if (!hasResisted) {
        hasResisted = true;
        // Simulate resistance by temporarily preventing further movement
        setTimeout(() => {
          if (isDragging) {
            // If still dragging after resistance, collapse
            panel.style.width = "0%";
            isDragging = false;
          }
        }, 150);
      }
    }
  };

  const handlePointerUp = () => {
    isDragging = false;
    hasResisted = false;
    document.body.style.cursor = "";
  };

  return (
    <ResizablePrimitive.PanelResizeHandle
      className={cn(
        "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
          <DragHandleDots2Icon className="h-2.5 w-2.5" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
};

const ResizablePanelGroup = ResizablePrimitive.PanelGroup;

export { ResizablePanel, ResizableHandle, ResizablePanelGroup };

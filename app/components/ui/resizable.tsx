// app/components/ui/resizable.tsx

import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";

interface ResizablePanelProps {
  direction?: "vertical" | "horizontal";
  children: React.ReactNode;
  className?: string;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  size?: number;
  onLayout?: (sizes: number[]) => void;
}

interface ResizablePanelGroupProps {
  direction?: "vertical" | "horizontal";
  children: React.ReactNode;
  className?: string;
  onLayout?: (sizes: number[]) => void;
}

interface ResizableHandleProps {
  withHandle?: boolean;
  className?: string;
  onDragStart?: () => void;
}

export function ResizablePanelGroup({
  direction = "horizontal",
  children,
  className,
}: ResizablePanelGroupProps) {
  return (
    <div className={cn("flex", direction === "horizontal" ? "flex-row" : "flex-col", className)}>
      {children}
    </div>
  );
}

export function ResizableHandle({
  withHandle = false,
  className,
  onDragStart,
}: ResizableHandleProps) {
  const handleMouseDown = () => {
    if (onDragStart) onDragStart();
  };

  return (
    <button
      className={cn(
        "flex items-center justify-center",
        withHandle ? "w-2 cursor-col-resize hover:bg-gray-200" : "w-1 cursor-col-resize",
        className,
      )}
      onMouseDown={handleMouseDown}
      aria-label="Resize panel"
    >
      {withHandle && <div className="w-1 h-8 bg-gray-300 rounded-full" />}
    </button>
  );
}

export function ResizablePanel({
  direction = "horizontal",
  children,
  className,
  defaultSize = 33,
  minSize = 10,
  maxSize = 90,
  size,
}: ResizablePanelProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [currentSize, setCurrentSize] = useState(size ?? defaultSize);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (size !== undefined) {
      setCurrentSize(size);
    }
  }, [size]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;

      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;

      let newSize =
        direction === "horizontal"
          ? ((event.clientX - rect.left) / rect.width) * 100
          : ((event.clientY - rect.top) / rect.height) * 100;

      newSize = Math.max(minSize, Math.min(newSize, maxSize));
      setCurrentSize(newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, direction, minSize, maxSize]);

  const containerStyles =
    direction === "horizontal" ? { width: `${currentSize}%` } : { height: `${currentSize}%` };

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  return (
    <div ref={ref} className={cn("relative", className)} style={containerStyles}>
      {children}
      <button
        className={cn(
          "absolute opacity-0 group-hover:opacity-100",
          direction === "horizontal"
            ? "right-0 top-0 w-1 h-full cursor-ew-resize"
            : "bottom-0 left-0 h-1 w-full cursor-ns-resize",
        )}
        onMouseDown={handleResizeStart}
        aria-label="Resize panel"
      />
    </div>
  );
}

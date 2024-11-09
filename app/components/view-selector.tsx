// app/components/view-selector.tsx

import * as React from "react";
import { useNavigate, useLocation } from "@remix-run/react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { type apps } from "~/db/schema";

type ViewSelectorProps = {
  apps: (typeof apps.$inferSelect)[];
};

export function ViewSelector({ apps }: ViewSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  const [value, setValue] = React.useState(
    location.pathname.startsWith("/back-office") ? "back-office" : "objects",
  );
  const navigate = useNavigate();
  const selectedView = apps.find((view) => view.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center">{selectedView?.label || "Select view..."}</div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command className="bg-white opacity-100">
          <CommandInput placeholder="Search view..." />
          <CommandList>
            <CommandEmpty>No view found.</CommandEmpty>
            <CommandGroup>
              {apps.map((app) => (
                <CommandItem
                  key={app.value}
                  value={app.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue);
                    navigate(`/${currentValue}`);
                    setOpen(false);
                  }}
                >
                  {app.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === app.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

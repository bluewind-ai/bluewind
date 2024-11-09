// File: app/components/ViewSelector.tsx

import * as React from "react";
import { useNavigate, useLocation, useRouteLoaderData } from "@remix-run/react";
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
import type { ViewData } from "~/routes/_app";

export function ViewSelector() {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  const rootData = useRouteLoaderData<{ views: ViewData[] }>("routes/back-office+/_root");
  const views = rootData?.views || [];

  const [value, setValue] = React.useState(
    location.pathname.startsWith("/back-office") ? "back-office" : "objects",
  );
  const navigate = useNavigate();
  const selectedView = views.find((view) => view.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center">
            {selectedView?.label || "Select view..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search view..." />
          <CommandList>
            <CommandEmpty>No view found.</CommandEmpty>
            <CommandGroup>
              {views.map((view) => (
                <CommandItem
                  key={view.value}
                  value={view.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue);
                    navigate(`/${currentValue}`);
                    setOpen(false);
                  }}
                >
                  {view.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === view.value ? "opacity-100" : "opacity-0",
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
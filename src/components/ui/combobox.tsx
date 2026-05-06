"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./tooltip";

interface ComboboxProps {
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  multiple?: boolean;
}

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  multiple = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedValues = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : [];
    }
    return typeof value === "string" ? [value].filter(Boolean) : [];
  }, [value, multiple]);

  const selectedOptions = React.useMemo(() => {
    return options.filter((option) => selectedValues.includes(option.value));
  }, [options, selectedValues]);

  const handleSelect = (selectedValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(selectedValue)
        ? selectedValues.filter((v) => v !== selectedValue)
        : [...selectedValues, selectedValue];
      onValueChange(newValues);
    } else {
      onValueChange(selectedValue === value ? "" : selectedValue);
      setOpen(false);
    }
  };

  const handleRemove = (valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      const newValues = selectedValues.filter((v) => v !== valueToRemove);
      onValueChange(newValues);
    }
  };

  // Sort options to show selected items first
  const sortedOptions = React.useMemo(() => {
    if (!multiple) return options;

    const selected = options.filter((option) =>
      selectedValues.includes(option.value)
    );
    const unselected = options.filter(
      (option) => !selectedValues.includes(option.value)
    );

    return [...selected, ...unselected];
  }, [options, selectedValues, multiple]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          <div className="flex gap-1 flex-wrap flex-1 overflow-hidden">
            {selectedOptions.length === 0 ? (
              <span>{placeholder}</span>
            ) : multiple && selectedOptions.length > 2 ? (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{selectedOptions.length} selected</span>
                  </TooltipTrigger>
                  <TooltipContent className="flex flex-col gap-2">
                    {selectedOptions.map((option, index) => (
                      <p
                        key={index}
                        className="font-bold flex items-center gap-1 border rounded-md p-1 px-2 border-gray-200"
                      >
                        <span
                          className="group font-extrabold ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleRemove(option.value, e as any);
                            }
                          }}
                          onMouseDown={(e) => handleRemove(option.value, e)}
                          role="button"
                          tabIndex={0}
                        >
                          <X
                            strokeWidth={2.5}
                            className="h-3 w-3 hover:text-destructive group-hover:text-destructive"
                          />
                        </span>
                        {option.label}
                      </p>
                    ))}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              selectedOptions.map((option, index) =>
                multiple ? (
                  <Badge key={index} variant="default" className="mr-1">
                    {option.label}
                    <span
                      className="group ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRemove(option.value, e as any);
                        }
                      }}
                      onMouseDown={(e) => handleRemove(option.value, e)}
                      role="button"
                      tabIndex={0}
                    >
                      <X
                        strokeWidth={2.5}
                        className="h-3 w-3 hover:text-destructive group-hover:text-destructive"
                      />
                    </span>
                  </Badge>
                ) : (
                  <span key={option.value}>{option.label}</span>
                )
              )
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {sortedOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

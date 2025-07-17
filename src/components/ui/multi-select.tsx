
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, X, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";

const multiSelectVariants = cva(
  "flex items-center justify-between w-full p-1 text-sm border rounded-md border-input ring-offset-background",
  {
    variants: {
      variant: {
        default: "h-10",
        sm: "h-9",
        lg: "h-11",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface MultiSelectOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MultiSelectProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof multiSelectVariants> {
  options: MultiSelectOption[];
  onValueChange: (value: string[]) => void;
  defaultValue: string[];
  placeholder?: string;
  maxCount?: number;
}

const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      onValueChange,
      variant,
      defaultValue = [],
      placeholder = "Select options",
      maxCount,
      className,
      ...props
    },
    ref
  ) => {
    const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    React.useEffect(() => {
        // To ensure external changes to defaultValue are reflected
        if (JSON.stringify(defaultValue) !== JSON.stringify(selectedValues)) {
            setSelectedValues(defaultValue);
        }
    }, [defaultValue, selectedValues]);

    const handleSelect = (value: string) => {
      const newSelectedValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    };
    
    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setSelectedValues([]);
        onValueChange([]);
    }

    const isMaxCountReached = maxCount && selectedValues.length >= maxCount;

    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
            <Button
                ref={ref}
                {...props}
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                className={cn("w-full justify-between", className)}
                variant="outline"
            >
                <div className="flex flex-wrap items-center gap-1">
                {selectedValues.length > 0 ? (
                    selectedValues.map((value) => {
                    const option = options.find((o) => o.value === value);
                    if (!option) return null;
                    return (
                        <Badge
                            key={value}
                            variant="secondary"
                            className="px-2 py-1"
                        >
                            {option.label}
                        </Badge>
                    );
                    })
                ) : (
                    <span className="text-sm text-muted-foreground">{placeholder}</span>
                )}
                </div>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}
                      disabled={!isSelected && isMaxCountReached}
                      className={cn("flex items-center justify-between", isMaxCountReached && !isSelected ? "opacity-50 cursor-not-allowed" : "")}
                    >
                      <div className="flex items-center">
                        {option.icon && <option.icon className="mr-2 h-4 w-4" />}
                        {option.label}
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };

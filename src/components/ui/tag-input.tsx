
'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Command as CommandPrimitive } from 'cmdk';

interface TagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  tags: string[];
  setTags: (tags: string[]) => void;
  options?: string[];
}

export const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>((props, ref) => {
  const { placeholder, tags, setTags, className, options = [] } = props;

  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [filteredOptions, setFilteredOptions] = React.useState<string[]>(options);

  React.useEffect(() => {
    const newFilteredOptions = options.filter(
      (option) =>
        !tags.includes(option) &&
        option.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredOptions(newFilteredOptions);
  }, [inputValue, tags, options]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      e.stopPropagation(); // Stop event from bubbling up to the form
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputValue('');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div>
      <div className={`flex flex-wrap gap-2 rounded-md border border-input p-2 ${className}`}>
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary">
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-1 h-4 w-4 rounded-full"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        <CommandPrimitive className="bg-transparent">
          <div className="relative w-full">
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onBlur={() => setOpen(false)}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
            />
            {open && filteredOptions.length > 0 && (
              <div className="absolute w-full z-10 top-full mt-2 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                <CommandList>
                  <CommandGroup>
                    {filteredOptions.map((option) => (
                      <CommandItem
                        key={option}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onSelect={() => {
                          setInputValue('');
                          setTags([...tags, option]);
                        }}
                        className="cursor-pointer"
                      >
                        {option}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </div>
            )}
          </div>
        </CommandPrimitive>
      </div>
    </div>
  );
});

TagInput.displayName = 'TagInput';

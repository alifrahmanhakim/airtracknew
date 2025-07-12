
'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface RichTextInputProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
}

const RichTextInput = React.forwardRef<HTMLDivElement, RichTextInputProps>(
  ({ className, name, ...props }, ref) => {
    const { register, setValue, watch } = useFormContext();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = React.useState(false);

    const value = watch(name);

    React.useEffect(() => {
        setIsMounted(true);
        register(name);
    }, [register, name]);

    // Set initial content from form state once component is mounted
    React.useEffect(() => {
        if (isMounted && contentRef.current && value) {
            if (contentRef.current.innerHTML !== value) {
                contentRef.current.innerHTML = value;
            }
        }
    }, [isMounted, value]);

    const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
      const dirtyHTML = event.currentTarget.innerHTML;
      const cleanHTML = DOMPurify.sanitize(dirtyHTML, { USE_PROFILES: { html: true } });
      setValue(name, cleanHTML, { shouldValidate: true, shouldDirty: true });
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const paste = event.clipboardData.getData('text/html') || event.clipboardData.getData('text/plain');
      const cleanPaste = DOMPurify.sanitize(paste, { USE_PROFILES: { html: true } });
      
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      selection.deleteFromDocument();
      const range = selection.getRangeAt(0);
      
      const fragment = range.createContextualFragment(cleanPaste);
      range.insertNode(fragment);

      // Move cursor to the end of the pasted content
      selection.collapseToEnd();

      // Trigger the input handler to update the form state
      handleInput({ currentTarget: event.currentTarget } as React.FormEvent<HTMLDivElement>);
    };

    return (
      <div
        ref={(el) => {
            if (typeof ref === 'function') ref(el);
            (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className={cn(
          'flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm prose dark:prose-invert max-w-none',
          className
        )}
        {...props}
      />
    );
  }
);
RichTextInput.displayName = 'RichTextInput';

export { RichTextInput };


'use client';

import * as React from 'react';
import { Toast, type ToastProps } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CopyableToastProps extends ToastProps {
  children: React.ReactNode;
}

export function CopyableToast({ children, ...props }: CopyableToastProps) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = React.useState(false);

  const description = React.Children.toArray(children)
    .flatMap(child =>
      React.isValidElement(child) ? React.Children.toArray(child.props.children) : []
    )
    .find(child => React.isValidElement(child) && child.props.className?.includes('select-text'))
    ?.props.children;

  const onCopy = () => {
    if (typeof description === 'string') {
      navigator.clipboard.writeText(description);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } else {
        toast({
            variant: 'destructive',
            title: 'Copy Failed',
            description: 'Could not find text to copy.',
        });
    }
  };

  return (
    <Toast {...props}>
        <div className="flex items-start justify-between w-full">
            <div className="flex-grow pr-4">{children}</div>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive-foreground/70 hover:text-destructive-foreground hover:bg-destructive-foreground/10"
                onClick={onCopy}
            >
                {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copy message</span>
            </Button>
        </div>
    </Toast>
  );
}

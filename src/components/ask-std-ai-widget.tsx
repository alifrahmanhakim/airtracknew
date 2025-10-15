
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FlaskConical, Loader2 } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';

export function AskStdAiWidget() {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Reset loading state when the dialog is opened
  React.useEffect(() => {
    if (open) {
      setIsLoading(true);
    }
  }, [open]);

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 flex items-center justify-center"
              size="icon"
              onClick={() => setOpen(true)}
            >
              <FlaskConical className="h-7 w-7" />
              <span className="sr-only">Ask STD.Ai</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Ask STD.Ai</p>
          </TooltipContent>
        </Tooltip>
        <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Ask STD.Ai</DialogTitle>
            <DialogDescription>
                Your intelligent assistant for aviation regulation and safety standards.
            </DialogDescription>
          </DialogHeader>
          <div className="relative flex-1 w-full rounded-b-lg border-t bg-muted overflow-hidden">
             {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading assistant...</p>
                </div>
             )}
             <iframe
                src="https://qwen-qwen3-vl-30b-a3b-demo.hf.space"
                className={cn("h-full w-full transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100")}
                title="Ask STD.Ai Assistant"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                onLoad={() => setIsLoading(false)}
              ></iframe>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

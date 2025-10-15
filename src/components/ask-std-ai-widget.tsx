
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
import { FlaskConical } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function AskStdAiWidget() {
  const [open, setOpen] = React.useState(false);

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
          <div className="flex-1 w-full rounded-b-lg border-t bg-muted overflow-hidden">
             <iframe
                src="https://qwen-qwen3-vl-30b-a3b-demo.hf.space"
                className="h-full w-full"
                title="Ask STD.Ai Assistant"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              ></iframe>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

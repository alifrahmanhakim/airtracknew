
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FlaskConical, Loader2, X } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';

export function AskStdAiWidget() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isMounted, setIsMounted] = React.useState(false);

  const handleToggle = () => {
    // We only mount the iframe when the user clicks for the first time
    if (!isMounted) {
      setIsMounted(true);
    }
    setIsOpen(!isOpen);
  };

  // Preload the iframe URL to potentially speed up loading
  React.useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = 'https://qwen-qwen3-vl-30b-a3b-demo.hf.space';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 flex items-center justify-center"
            size="icon"
            onClick={handleToggle}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
          >
            <FlaskConical className="h-7 w-7" />
            <span className="sr-only">Ask STD.Ai</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Ask STD.Ai</p>
        </TooltipContent>
      </Tooltip>

      {/* The pop-up window, controlled by CSS classes */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)} // Close on overlay click
        aria-hidden={!isOpen}
      >
        <Card
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the card
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-4xl h-[80vh] flex flex-col p-0 -translate-x-1/2 -translate-y-1/2",
            "transition-all duration-300",
            isOpen ? "opacity-100 translate-y-[-50%]" : "opacity-0 translate-y-[-48%]"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b">
            <div className='space-y-1.5'>
              <CardTitle>Ask STD.Ai</CardTitle>
              <CardDescription>
                  Your intelligent assistant for aviation regulation and safety standards.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </Button>
          </CardHeader>
          <CardContent className="relative flex-1 w-full rounded-b-lg overflow-hidden p-0">
             {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading assistant...</p>
                </div>
             )}
             {isMounted && (
               <iframe
                  src="https://qwen-qwen3-vl-30b-a3b-demo.hf.space"
                  className={cn("h-full w-full border-0 transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100")}
                  title="Ask STD.Ai Assistant"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  onLoad={() => setIsLoading(false)}
                ></iframe>
             )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}


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
import { BotMessageSquare, Loader2, X } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';

export function AskStdAiWidget() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [showLoadingOverlay, setShowLoadingOverlay] = React.useState(true);

  const handleToggle = () => {
    if (!isMounted) {
      setIsMounted(true);
    }
    setIsOpen(!isOpen);
  };
  
  React.useEffect(() => {
    if (isMounted && !isIframeLoaded) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + Math.floor(Math.random() * 3) + 1; // Slower progress
        });
      }, 500); // Slower interval
      
      return () => clearInterval(interval);
    }
  }, [isMounted, isIframeLoaded]);


  const handleIframeLoad = () => {
    setLoadingProgress(100);
    setIsIframeLoaded(true);
    // Add a delay before hiding the overlay to cover the internal loading of the iframe app
    setTimeout(() => {
        setShowLoadingOverlay(false);
    }, 2000); // 2-second delay
  };


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
            <BotMessageSquare className="h-10 w-10" />
            <span className="sr-only">Ask STD.Ai</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Ask STD.Ai</p>
        </TooltipContent>
      </Tooltip>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden={!isOpen}
      />
        
      <Card
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-4xl h-[80vh] flex flex-col p-0 -translate-x-1/2 -translate-y-1/2 border-2 border-primary/20",
          "transition-all duration-300",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
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
            {showLoadingOverlay && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-10 p-8 text-center transition-opacity duration-500">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-lg font-semibold mb-2">Initial loading, we're getting things ready for you.</p>
                  <div className="w-full max-w-sm">
                    <Progress value={loadingProgress} className="h-2 w-full" />
                    <p className="text-sm text-muted-foreground mt-2">{Math.round(loadingProgress)}%</p>
                  </div>
              </div>
            )}
            {isMounted && (
              <iframe
                src="https://qwen-qwen3-vl-30b-a3b-demo.hf.space"
                className={cn(
                    "h-full w-full border-0 transition-opacity duration-500",
                    isIframeLoaded ? "opacity-100" : "opacity-0"
                )}
                title="Ask STD.Ai Assistant"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                onLoad={handleIframeLoad}
              ></iframe>
            )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

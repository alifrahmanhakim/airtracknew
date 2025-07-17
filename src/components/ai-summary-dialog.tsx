'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { getAiSummary } from '@/lib/actions/ai';
import { useToast } from '@/hooks/use-toast';
import type { SummarizeProjectStatusOutput } from '@/ai/flows/summarize-project-status';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type AiSummaryDialogProps = {
  taskCompletion: string;
  notes: string;
};

export function AiSummaryDialog({ taskCompletion, notes: initialNotes }: AiSummaryDialogProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [summary, setSummary] = useState<SummarizeProjectStatusOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setSummary(null);
    const result = await getAiSummary({ taskCompletion, notes });
    setIsLoading(false);

    if (result.success && result.data) {
      setSummary(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSummary(null);
      setIsLoading(false);
      setNotes(initialNotes);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate AI Summary</DialogTitle>
          <DialogDescription>
            Review project notes and task completion, then generate a concise summary.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="task-completion" className="text-right">
              Completion
            </Label>
            <div id="task-completion" className="col-span-3 font-medium">
              {taskCompletion}%
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right pt-2">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              rows={8}
            />
          </div>
        </div>
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Generating summary...</p>
          </div>
        )}
        {summary && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>AI-Generated Summary</AlertTitle>
            <AlertDescription>
                <p className="mt-2">{summary.summary}</p>
            </AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button onClick={handleGenerateSummary} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

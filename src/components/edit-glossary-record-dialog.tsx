
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, Pencil, ArrowRight } from 'lucide-react';
import type { GlossaryRecord, StatusHistoryItem } from '@/lib/types';
import { GlossarySharedFormFields, formSchema, type GlossaryFormValues } from './glossary-shared-form-fields';
import { updateGlossaryRecord } from '@/lib/actions/glossary';
import { ScrollArea } from './ui/scroll-area';
import { format, parseISO, isValid } from 'date-fns';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

type EditGlossaryRecordDialogProps = {
  record: GlossaryRecord;
  onRecordUpdate: (updatedRecord: GlossaryRecord) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditGlossaryRecordDialog({ record, onRecordUpdate, open, onOpenChange }: EditGlossaryRecordDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<GlossaryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tsu: record.tsu,
      tsa: record.tsa,
      editing: record.editing,
      makna: record.makna,
      keterangan: record.keterangan,
      referensi: record.referensi || '',
      status: record.status,
    },
  });

  const onSubmit = async (data: GlossaryFormValues) => {
    setIsLoading(true);
    
    const result = await updateGlossaryRecord(record.id, data);

    setIsLoading(false);

    if (result.success && result.data) {
        onRecordUpdate(result.data);
        toast({
            title: 'Record Updated!',
            description: 'Your glossary record has been successfully updated.',
        });
        onOpenChange(false);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to update record.',
        });
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
        case 'Final': return 'bg-green-100 text-green-800 hover:bg-green-200';
        case 'Draft': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
        case 'Usulan': return 'bg-red-100 text-red-800 hover:bg-red-200';
        default: return 'bg-muted text-muted-foreground';
    }
  };

  const renderStatusChange = () => {
    const history = record.statusHistory || [];
    if (!history || history.length === 0) {
      return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>No status history available.</span>
          </div>
      );
    }
  
    const lastChange = history[history.length - 1];
    const isCreation = history.length === 1;

    return (
        <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex items-center gap-1.5 flex-wrap">
                 {isCreation ? (
                     <div className="flex items-center gap-1.5">
                        <span className="text-xs">Created as</span>
                        <Badge className={cn(getStatusClass(lastChange.status))}>{lastChange.status}</Badge>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className={cn("font-normal", getStatusClass(history[history.length - 2].status))}>
                            {history[history.length - 2].status}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge className={cn(getStatusClass(lastChange.status))}>
                            {lastChange.status}
                        </Badge>
                    </div>
                )}
            </div>
             <span className="text-muted-foreground text-xs flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {format(parseISO(lastChange.date), 'dd MMM yyyy, HH:mm')}
            </span>
        </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onOpenChange(true); }}>
            <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Glossary Record</DialogTitle>
              <DialogDescription>
                Make changes to the record for TSU: <span className='font-semibold'>{record.tsu}</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-grow overflow-y-auto pr-6 my-4">
                <div className="space-y-8">
                     <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800/50">
                        {renderStatusChange()}
                    </div>
                    <GlossarySharedFormFields form={form} />
                </div>
            </div>

            <DialogFooter className="pt-4 border-t flex-shrink-0">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

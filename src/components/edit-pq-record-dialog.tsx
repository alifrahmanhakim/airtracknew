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
import { Loader2, Pencil } from 'lucide-react';
import type { PqRecord } from '@/lib/types';
import { PqsSharedFormFields, formSchema, type PqFormValues } from './pqs-shared-form-fields';
import { updatePqRecord } from '@/lib/actions/pqs';
import { ScrollArea } from './ui/scroll-area';

type EditPqRecordDialogProps = {
  record: PqRecord;
  onRecordUpdate: (updatedRecord: PqRecord) => void;
};

export function EditPqRecordDialog({ record, onRecordUpdate }: EditPqRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PqFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pqNumber: record.pqNumber,
      protocolQuestion: record.protocolQuestion,
      guidance: record.guidance,
      icaoReferences: record.icaoReferences,
      ppq: record.ppq,
      criticalElement: record.criticalElement,
      remarks: record.remarks,
      evidence: record.evidence,
      answer: record.answer,
      poc: record.poc,
      icaoStatus: record.icaoStatus,
      cap: record.cap,
      sspComponent: record.sspComponent || '',
      status: record.status,
    },
  });

  const onSubmit = async (data: PqFormValues) => {
    setIsLoading(true);
    
    const result = await updatePqRecord(record.id, data);

    setIsLoading(false);

    if (result.success && result.data) {
        onRecordUpdate(result.data);
        toast({
            title: 'Record Updated!',
            description: 'Your PQ record has been successfully updated.',
        });
        setOpen(false);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to update record.',
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit PQ Record</DialogTitle>
              <DialogDescription>
                Make changes to the record for PQ Number: <span className='font-semibold'>{record.pqNumber}</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-grow overflow-y-auto pr-6 my-4">
                <div className="space-y-8">
                    <PqsSharedFormFields form={form} />
                </div>
            </div>

            <DialogFooter className="pt-4 border-t flex-shrink-0">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

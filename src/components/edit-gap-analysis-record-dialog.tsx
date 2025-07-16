

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
import type { GapAnalysisRecord, Project } from '@/lib/types';
import { GapAnalysisSharedFormFields, formSchema, type GapAnalysisFormValues } from './gap-analysis-shared-form-fields';
import { updateGapAnalysisRecord } from '@/lib/actions';
import { ScrollArea } from './ui/scroll-area';
import { parseISO } from 'date-fns';
import { ComboboxOption } from './ui/combobox';

type EditGapAnalysisRecordDialogProps = {
  record: GapAnalysisRecord;
  onRecordUpdate: (updatedRecord: GapAnalysisRecord) => void;
};

export function EditGapAnalysisRecordDialog({ record, onRecordUpdate }: EditGapAnalysisRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<GapAnalysisFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...record,
      embeddedApplicabilityDate: parseISO(record.embeddedApplicabilityDate),
      dateOfEvaluation: record.dateOfEvaluation,
      effectiveDate: record.effectiveDate,
      applicabilityDate: record.applicabilityDate,
      inspectors: record.inspectors || [],
    },
  });

  const onSubmit = async (data: GapAnalysisFormValues) => {
    setIsLoading(true);
    
    // The date is already a Date object from the form, so we just need to format it if needed by the backend.
    // The action already expects a GapAnalysisFormValues, where the date is a Date object.
    const result = await updateGapAnalysisRecord(record.id, data);

    setIsLoading(false);

    if (result.success && result.data) {
        onRecordUpdate(result.data);
        toast({
            title: 'Record Updated!',
            description: 'Your GAP Analysis record has been successfully updated.',
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
              <DialogTitle>Edit GAP Analysis Record</DialogTitle>
              <DialogDescription>
                Make changes to the record for SL Ref: <span className='font-semibold'>{record.slReferenceNumber}</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-grow overflow-y-auto pr-6 my-4">
                <div className="space-y-8">
                    <GapAnalysisSharedFormFields form={form} casrOptions={[]} />
                </div>
            </div>

            <DialogFooter className="pt-4 border-t flex-shrink-0">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
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

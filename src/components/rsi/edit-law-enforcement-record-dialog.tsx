
'use client';

import * as React from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pencil } from 'lucide-react';
import type { LawEnforcementRecord } from '@/lib/types';
import { LawEnforcementForm } from './law-enforcement-form';
import { updateLawEnforcementRecord } from '@/lib/actions/law-enforcement';
import { lawEnforcementFormSchema } from '@/lib/schemas';
import { parseISO, format } from 'date-fns';
import type { z } from 'zod';

type LawEnforcementFormValues = z.infer<typeof lawEnforcementFormSchema>;

type EditLawEnforcementRecordDialogProps = {
  record: LawEnforcementRecord;
  onRecordUpdate: (record: LawEnforcementRecord) => void;
};

export function EditLawEnforcementRecordDialog({ record, onRecordUpdate }: EditLawEnforcementRecordDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<LawEnforcementFormValues>({
    resolver: zodResolver(lawEnforcementFormSchema),
    defaultValues: {
      ...record,
      references: record.references?.map(ref => ({...ref, dateLetter: ref.dateLetter ? format(parseISO(ref.dateLetter), 'yyyy-MM-dd') : ''})) || []
    },
  });

  const onSubmit = async (data: LawEnforcementFormValues) => {
    setIsSubmitting(true);
    const result = await updateLawEnforcementRecord(record.id, data);
    setIsSubmitting(false);

    if (result.success && result.data) {
      onRecordUpdate(result.data);
      toast({ title: 'Record Updated', description: 'The record has been successfully updated.' });
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
        <DialogHeader>
          <DialogTitle>Edit Law Enforcement Record</DialogTitle>
          <DialogDescription>
            Make changes to the sanction record.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-1">
          <LawEnforcementForm form={form} isSubmitting={isSubmitting} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

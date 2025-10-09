

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
import type { TindakLanjutDgcaRecord } from '@/lib/types';
import { TindakLanjutDgcaForm } from './tindak-lanjut-dgca-form';
import { updateTindakLanjutDgcaRecord } from '@/lib/actions/tindak-lanjut-dgca';
import { tindakLanjutDgcaFormSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { ScrollArea } from '../ui/scroll-area';
import { format, parseISO } from 'date-fns';

type TindakLanjutDgcaFormValues = z.infer<typeof tindakLanjutDgcaFormSchema>;

type EditTindakLanjutDgcaDialogProps = {
  record: TindakLanjutDgcaRecord;
  onRecordUpdate: (record: TindakLanjutDgcaRecord) => void;
};

export function EditTindakLanjutDgcaDialog({ record, onRecordUpdate }: EditTindakLanjutDgcaDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<TindakLanjutDgcaFormValues>({
    resolver: zodResolver(tindakLanjutDgcaFormSchema),
    defaultValues: {
      ...record,
      tanggalKejadian: record.tanggalKejadian ? format(parseISO(record.tanggalKejadian), 'yyyy-MM-dd') : '',
      tanggalTerbit: record.tanggalTerbit ? format(parseISO(record.tanggalTerbit), 'yyyy-MM-dd') : undefined,
    },
  });

  const onSubmit = async (data: TindakLanjutDgcaFormValues) => {
    setIsSubmitting(true);
    const result = await updateTindakLanjutDgcaRecord(record.id, data);
    setIsSubmitting(false);

    if (result.success && result.data) {
      onRecordUpdate(result.data as TindakLanjutDgcaRecord);
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
          <DialogTitle>Edit Tindak Lanjut DGCA Record</DialogTitle>
          <DialogDescription>
            Make changes to the record.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
          <TindakLanjutDgcaForm form={form} />
        </ScrollArea>
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

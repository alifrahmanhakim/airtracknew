
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
import type { KnktReport } from '@/lib/types';
import { KnktReportForm } from './knkt-report-form';
import { updateKnktReport } from '@/lib/actions/knkt';
import { knktReportFormSchema } from '@/lib/schemas';
import { parseISO } from 'date-fns';
import type { z } from 'zod';

type KnktReportFormValues = z.infer<typeof knktReportFormSchema>;

type EditKnktReportDialogProps = {
  record: KnktReport;
  onRecordUpdate: (record: KnktReport) => void;
};

export function EditKnktReportDialog({ record, onRecordUpdate }: EditKnktReportDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<KnktReportFormValues>({
    resolver: zodResolver(knktReportFormSchema),
    defaultValues: {
      ...record,
      tanggal_diterbitkan: parseISO(record.tanggal_diterbitkan),
      keterangan: record.keterangan || '',
      taxonomy: record.taxonomy || '',
    },
  });

  const onSubmit = async (data: KnktReportFormValues) => {
    setIsSubmitting(true);
    const result = await updateKnktReport(record.id, data);
    setIsSubmitting(false);

    if (result.success && result.data) {
      onRecordUpdate(result.data);
      toast({ title: 'Record Updated', description: 'The KNKT report has been successfully updated.' });
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
          <DialogTitle>Edit KNKT Report</DialogTitle>
          <DialogDescription>
            Make changes to report: <span className="font-semibold">{record.nomor_laporan}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-1">
            <KnktReportForm form={form} />
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

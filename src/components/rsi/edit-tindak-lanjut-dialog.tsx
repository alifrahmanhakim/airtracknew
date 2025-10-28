
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
import type { TindakLanjutRecord } from '@/lib/types';
import { TindakLanjutForm } from './tindak-lanjut-form';
import { updateTindakLanjutRecord } from '@/lib/actions/tindak-lanjut';
import { tindakLanjutFormSchema } from '@/lib/schemas';
import { parseISO, format, isValid } from 'date-fns';
import type { z } from 'zod';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

type TindakLanjutFormValues = z.infer<typeof tindakLanjutFormSchema>;

type EditTindakLanjutRecordDialogProps = {
  record: TindakLanjutRecord;
  onRecordUpdate: (record: TindakLanjutRecord) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const getDialogBgClass = (status: string) => {
    switch (status) {
        case 'Final': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50';
        case 'Draft': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50';
        case 'Draft Final': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50';
        case 'Preliminary': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50';
        case 'Interim Statement': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50';
        case 'Usulan': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50';
        default: return 'bg-card';
    }
}

export function EditTindakLanjutRecordDialog({ record, onRecordUpdate, open, onOpenChange }: EditTindakLanjutRecordDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<TindakLanjutFormValues>({
    resolver: zodResolver(tindakLanjutFormSchema),
    defaultValues: {
      ...record,
      tanggalKejadian: record.tanggalKejadian && isValid(parseISO(record.tanggalKejadian)) ? format(parseISO(record.tanggalKejadian), 'yyyy-MM-dd') : '',
      tanggalTerbit: record.tanggalTerbit && isValid(parseISO(record.tanggalTerbit)) ? format(parseISO(record.tanggalTerbit), 'yyyy-MM-dd') : '',
      status: record.status || 'Draft',
      registrasiPesawat: record.registrasiPesawat || '',
      tipePesawat: record.tipePesawat || '',
      lokasiKejadian: record.lokasiKejadian || '',
      fileUrl: record.fileUrl || '',
      rekomendasi: record.rekomendasi || [],
      tindakLanjutDkppu: record.tindakLanjutDkppu || '',
      tindakLanjutOperator: record.tindakLanjutOperator || '',
    },
  });
  
  React.useEffect(() => {
    if (record) {
      form.reset({
        ...record,
        tanggalKejadian: record.tanggalKejadian && isValid(parseISO(record.tanggalKejadian)) ? format(parseISO(record.tanggalKejadian), 'yyyy-MM-dd') : '',
        tanggalTerbit: record.tanggalTerbit && isValid(parseISO(record.tanggalTerbit)) ? format(parseISO(record.tanggalTerbit), 'yyyy-MM-dd') : '',
      });
    }
  }, [record, form]);

  const onSubmit = async (data: TindakLanjutFormValues) => {
    setIsSubmitting(true);

    const result = await updateTindakLanjutRecord(record.id, data);
    setIsSubmitting(false);

    if (result.success && result.data) {
      onRecordUpdate(result.data as TindakLanjutRecord);
      toast({ title: 'Record Updated', description: 'The record has been successfully updated.' });
      onOpenChange(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to update record.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className={cn("max-w-4xl", getDialogBgClass(record.status))}>
        <DialogHeader>
          <DialogTitle>Edit Tindak Lanjut Record</DialogTitle>
          <DialogDescription>
            Make changes to the record for report: <span className="font-semibold">{record.nomorLaporan}</span>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
          <TindakLanjutForm form={form} />
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

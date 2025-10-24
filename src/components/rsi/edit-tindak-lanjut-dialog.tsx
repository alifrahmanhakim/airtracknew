
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

type TindakLanjutFormValues = z.infer<typeof tindakLanjutFormSchema>;

type EditTindakLanjutRecordDialogProps = {
  record: TindakLanjutRecord;
  onRecordUpdate: (record: TindakLanjutRecord) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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
      <DialogContent className="max-w-4xl">
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



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
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { AccidentIncidentRecord } from '@/lib/types';
import { AccidentIncidentForm } from './accident-incident-form';
import { updateAccidentIncidentRecord } from '@/lib/actions/accident-incident';
import { accidentIncidentFormSchema } from '@/lib/schemas';
import { parseISO, format } from 'date-fns';
import type { z } from 'zod';
import { ScrollArea } from '../ui/scroll-area';

type AccidentIncidentFormValues = z.infer<typeof accidentIncidentFormSchema>;

type EditAccidentIncidentRecordDialogProps = {
  record: AccidentIncidentRecord;
  onRecordUpdate: (record: AccidentIncidentRecord) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const parseCasualtiesForForm = (korbanJiwa: string | undefined): { ada: 'Ada' | 'Tidak Ada'; jumlah: string } => {
    if (!korbanJiwa || korbanJiwa.toLowerCase() === 'tidak ada') {
      return { ada: 'Tidak Ada', jumlah: '' };
    }
    return { ada: 'Ada', jumlah: korbanJiwa };
  };

export function EditAccidentIncidentRecordDialog({ record, onRecordUpdate, open, onOpenChange }: EditAccidentIncidentRecordDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const korbanData = parseCasualtiesForForm(record.korbanJiwa);

  const form = useForm<AccidentIncidentFormValues>({
    resolver: zodResolver(accidentIncidentFormSchema),
    defaultValues: {
      ...record,
      tanggal: format(parseISO(record.tanggal), 'yyyy-MM-dd'),
      adaKorbanJiwa: korbanData.ada,
      jumlahKorbanJiwa: korbanData.jumlah,
      fileUrl: record.fileUrl || '',
    },
  });

  // Reset form when record changes to ensure it shows the correct data
  React.useEffect(() => {
    const newKorbanData = parseCasualtiesForForm(record.korbanJiwa);
    form.reset({
       ...record,
      tanggal: format(parseISO(record.tanggal), 'yyyy-MM-dd'),
      adaKorbanJiwa: newKorbanData.ada,
      jumlahKorbanJiwa: newKorbanData.jumlah,
      fileUrl: record.fileUrl || '',
    });
  }, [record, form]);


  const onSubmit = async (data: AccidentIncidentFormValues) => {
    setIsSubmitting(true);
    const result = await updateAccidentIncidentRecord(record.id, data);
    setIsSubmitting(false);

    if (result.success && result.data) {
      onRecordUpdate(result.data);
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Accident/Incident Record</DialogTitle>
          <DialogDescription>
            Make changes to the record for registration: <span className="font-semibold">{record.registrasiPesawat}</span>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
          <AccidentIncidentForm form={form} />
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

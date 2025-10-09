
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
import type { AccidentIncidentRecord } from '@/lib/types';
import { AccidentIncidentForm } from './accident-incident-form';
import { updateAccidentIncidentRecord } from '@/lib/actions/accident-incident';
import { accidentIncidentFormSchema } from '@/lib/schemas';
import { parseISO } from 'date-fns';
import type { z } from 'zod';

type AccidentIncidentFormValues = z.infer<typeof accidentIncidentFormSchema>;

type EditAccidentIncidentRecordDialogProps = {
  record: AccidentIncidentRecord;
  onRecordUpdate: (record: AccidentIncidentRecord) => void;
};

const parseCasualtiesForForm = (korbanJiwa: string | undefined): { ada: 'Ada' | 'Tidak Ada'; jumlah: string } => {
    if (!korbanJiwa || korbanJiwa.toLowerCase() === 'tidak ada') {
      return { ada: 'Tidak Ada', jumlah: '' };
    }
    return { ada: 'Ada', jumlah: korbanJiwa };
  };

export function EditAccidentIncidentRecordDialog({ record, onRecordUpdate }: EditAccidentIncidentRecordDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const korbanData = parseCasualtiesForForm(record.korbanJiwa);

  const form = useForm<AccidentIncidentFormValues>({
    resolver: zodResolver(accidentIncidentFormSchema),
    defaultValues: {
      ...record,
      tanggal: parseISO(record.tanggal),
      adaKorbanJiwa: korbanData.ada,
      jumlahKorbanJiwa: korbanData.jumlah,
    },
  });

  const onSubmit = async (data: AccidentIncidentFormValues) => {
    setIsSubmitting(true);
    const result = await updateAccidentIncidentRecord(record.id, data);
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
          <DialogTitle>Edit Accident/Incident Record</DialogTitle>
          <DialogDescription>
            Make changes to the record for registration: <span className="font-semibold">{record.registrasiPesawat}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-1">
          <AccidentIncidentForm form={form} onSubmit={onSubmit} />
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

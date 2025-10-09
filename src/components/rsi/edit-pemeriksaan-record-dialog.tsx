
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
import type { PemeriksaanRecord } from '@/lib/types';
import { PemeriksaanForm } from './pemeriksaan-form';
import { updatePemeriksaanRecord } from '@/lib/actions/pemeriksaan';
import { pemeriksaanFormSchema } from '@/lib/schemas';
import { parseISO } from 'date-fns';
import type { z } from 'zod';

type PemeriksaanFormValues = z.infer<typeof pemeriksaanFormSchema>;

type EditPemeriksaanRecordDialogProps = {
  record: PemeriksaanRecord;
  onRecordUpdate: (record: PemeriksaanRecord) => void;
};

export function EditPemeriksaanRecordDialog({ record, onRecordUpdate }: EditPemeriksaanRecordDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<PemeriksaanFormValues>({
    resolver: zodResolver(pemeriksaanFormSchema),
    defaultValues: {
      ...record,
      tanggal: parseISO(record.tanggal),
    },
  });

  const onSubmit = async (data: PemeriksaanFormValues) => {
    setIsSubmitting(true);
    const result = await updatePemeriksaanRecord(record.id, data);
    setIsSubmitting(false);

    if (result.success && result.data) {
      onRecordUpdate(result.data);
      toast({ title: 'Record Updated', description: 'The examination record has been successfully updated.' });
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
          <DialogTitle>Edit Examination Record</DialogTitle>
          <DialogDescription>
            Make changes to the record for registration: <span className="font-semibold">{record.registrasi}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-1">
          <PemeriksaanForm form={form} />
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

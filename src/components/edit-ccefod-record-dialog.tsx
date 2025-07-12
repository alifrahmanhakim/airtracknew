
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
import type { CcefodRecord } from '@/lib/types';
import { CcefodSharedFormFields, formSchema, type CcefodFormValues } from './ccefod-shared-form-fields';
import { updateCcefodRecord } from '@/lib/actions';
import { ScrollArea } from './ui/scroll-area';

type EditCcefodRecordDialogProps = {
  record: CcefodRecord;
  onRecordUpdate: (updatedRecord: CcefodRecord) => void;
};

export function EditCcefodRecordDialog({ record, onRecordUpdate }: EditCcefodRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CcefodFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        adaPerubahan: record.adaPerubahan,
        usulanPerubahan: record.usulanPerubahan || '',
        isiUsulan: record.isiUsulan || '',
        annex: record.annex,
        annexReference: record.annexReference,
        standardPractice: record.standardPractice,
        legislationReference: record.legislationReference,
        implementationLevel: record.implementationLevel,
        differenceText: record.differenceText || '',
        differenceReason: record.differenceReason || '',
        remarks: record.remarks || '',
        status: record.status,
    },
  });

  const onSubmit = async (data: CcefodFormValues) => {
    setIsLoading(true);
    
    const result = await updateCcefodRecord(record.id, data);

    setIsLoading(false);

    if (result.success && result.data) {
        onRecordUpdate(result.data);
        toast({
            title: 'Record Updated!',
            description: 'Your CCEFOD record has been successfully updated.',
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit CC/EFOD Record</DialogTitle>
          <DialogDescription>
            Make changes to the record for Annex Ref: <span className='font-semibold'>{record.annexReference}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                <div className='flex-1 min-h-0'>
                    <ScrollArea className="h-full pr-6">
                        <div className="space-y-8 py-4">
                            <CcefodSharedFormFields form={form} />
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter className="pt-4 border-t mt-4">
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

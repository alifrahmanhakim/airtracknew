
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
import type { GlossaryRecord } from '@/lib/types';
import { GlossarySharedFormFields, formSchema, type GlossaryFormValues } from './glossary-shared-form-fields';
import { updateGlossaryRecord } from '@/lib/actions/glossary';
import { ScrollArea } from './ui/scroll-area';

type EditGlossaryRecordDialogProps = {
  record: GlossaryRecord;
  onRecordUpdate: (updatedRecord: GlossaryRecord) => void;
};

export function EditGlossaryRecordDialog({ record, onRecordUpdate }: EditGlossaryRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<GlossaryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tsu: record.tsu,
      tsa: record.tsa,
      editing: record.editing,
      makna: record.makna,
      keterangan: record.keterangan,
      status: record.status,
    },
  });

  const onSubmit = async (data: GlossaryFormValues) => {
    setIsLoading(true);
    
    const result = await updateGlossaryRecord(record.id, data);

    setIsLoading(false);

    if (result.success && result.data) {
        onRecordUpdate(result.data);
        toast({
            title: 'Record Updated!',
            description: 'Your glossary record has been successfully updated.',
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
              <DialogTitle>Edit Glossary Record</DialogTitle>
              <DialogDescription>
                Make changes to the record for TSU: <span className='font-semibold'>{record.tsu}</span>
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-grow overflow-y-auto pr-6 my-4">
                <div className="space-y-8">
                    <GlossarySharedFormFields form={form} />
                </div>
            </ScrollArea>

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

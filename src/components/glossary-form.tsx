'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { addGlossaryRecord } from '@/lib/actions/glossary';
import type { GlossaryRecord } from '@/lib/types';
import { GlossarySharedFormFields, formSchema, type GlossaryFormValues } from './glossary-shared-form-fields';

type GlossaryFormProps = {
  onFormSubmit: (data: GlossaryRecord) => void;
};

export function GlossaryForm({ onFormSubmit }: GlossaryFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const defaultFormValues: GlossaryFormValues = {
    tsu: '',
    tsa: '',
    editing: '',
    makna: '',
    keterangan: '',
    status: 'Draft',
  };

  const form = useForm<GlossaryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  const onSubmit = async (data: GlossaryFormValues) => {
    setIsLoading(true);
    
    const result = await addGlossaryRecord(data);

    setIsLoading(false);

    if (result.success && result.data) {
        onFormSubmit(result.data);
        toast({
            title: 'Record Added Successfully!',
            description: 'The new translation analysis has been saved.',
        });
        form.reset(defaultFormValues);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to add record.',
        });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <GlossarySharedFormFields form={form} />
        <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => form.reset(defaultFormValues)} disabled={isLoading}>
                Reset
            </Button>
            <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
            </Button>
        </div>
      </form>
    </Form>
  );
}

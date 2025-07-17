

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { addCcefodRecord } from '@/lib/actions';
import type { CcefodRecord } from '@/lib/types';
import { CcefodSharedFormFields, type CcefodFormValues } from './ccefod-shared-form-fields';
import { ccefodFormSchema } from '@/lib/schemas';

type CcefodFormProps = {
  onFormSubmit: (data: CcefodRecord) => void;
};

export function CcefodForm({ onFormSubmit }: CcefodFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const defaultFormValues: CcefodFormValues = {
      adaPerubahan: 'TIDAK',
      usulanPerubahan: '',
      isiUsulan: '',
      annex: '',
      annexReference: '',
      standardPractice: '',
      legislationReference: '',
      implementationLevel: 'No difference',
      differenceText: '',
      differenceReason: '',
      remarks: '',
      status: 'Draft',
  };

  const form = useForm<CcefodFormValues>({
    resolver: zodResolver(ccefodFormSchema),
    defaultValues: defaultFormValues,
  });

  const onSubmit = async (data: CcefodFormValues) => {
    setIsLoading(true);
    
    const result = await addCcefodRecord(data);

    setIsLoading(false);

    if (result.success && result.data) {
        onFormSubmit(result.data);
        toast({
            title: 'Data Added Successfully!',
            description: 'Your CCEFOD monitoring data has been saved to Firestore.',
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
        <CcefodSharedFormFields form={form} />
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


'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { addPqRecord } from '@/lib/actions';
import type { PqRecord } from '@/lib/types';
import { PqsSharedFormFields, formSchema, type PqFormValues } from './pqs-shared-form-fields';

type PqsFormProps = {
  onFormSubmit: (data: PqRecord) => void;
};

export function PqsForm({ onFormSubmit }: PqsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const defaultFormValues: PqFormValues = {
    pqNumber: '',
    protocolQuestion: '',
    guidance: '',
    icaoReferences: '',
    ppq: 'YES',
    criticalElement: 'CE - 1',
    remarks: '',
    evidence: '',
    answer: '',
    poc: '',
    icaoStatus: 'Satisfactory',
    cap: '',
    sspComponent: '',
    status: 'Draft',
  };

  const form = useForm<PqFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  const onSubmit = async (data: PqFormValues) => {
    setIsLoading(true);
    
    const result = await addPqRecord(data);

    setIsLoading(false);

    if (result.success && result.data) {
        onFormSubmit(result.data);
        toast({
            title: 'Data Added Successfully!',
            description: 'Your Protocol Question data has been saved.',
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
        <PqsSharedFormFields form={form} />
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

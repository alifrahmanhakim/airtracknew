
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { addGapAnalysisRecord } from '@/lib/actions';
import type { GapAnalysisRecord } from '@/lib/types';
import { GapAnalysisSharedFormFields, formSchema, type GapAnalysisFormValues } from './gap-analysis-shared-form-fields';

type GapAnalysisFormProps = {
  onFormSubmit: (data: GapAnalysisRecord) => void;
};

export function GapAnalysisForm({ onFormSubmit }: GapAnalysisFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const defaultFormValues: GapAnalysisFormValues = {
    slReferenceNumber: '',
    annex: '',
    typeOfStateLetter: '',
    dateOfEvaluation: '',
    subject: '',
    actionRequired: '',
    effectiveDate: '',
    applicabilityDate: '',
    embeddedApplicabilityDate: 'N/A',
    evaluations: [
      { id: 'eval-1', icaoSarp: '', review: '', complianceStatus: 'No Differences' }
    ],
    statusItem: 'OPEN',
    summary: '',
    inspectorNames: ['', ''],
  };

  const form = useForm<GapAnalysisFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  const onSubmit = async (data: GapAnalysisFormValues) => {
    setIsLoading(true);
    
    const result = await addGapAnalysisRecord(data);

    setIsLoading(false);

    if (result.success && result.data) {
        onFormSubmit(result.data);
        toast({
            title: 'Data Added Successfully!',
            description: 'Your GAP Analysis data has been saved.',
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
        <GapAnalysisSharedFormFields form={form} />
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

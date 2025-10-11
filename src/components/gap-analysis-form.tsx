
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { addGapAnalysisRecord } from '@/lib/actions/gap-analysis';
import type { GapAnalysisRecord, Project } from '@/lib/types';
import { GapAnalysisSharedFormFields, type GapAnalysisFormValues } from './gap-analysis-shared-form-fields';
import { ComboboxOption } from './ui/combobox';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { gapAnalysisFormSchema as formSchema } from '@/lib/schemas';

type GapAnalysisFormProps = {
  onFormSubmit: (data: GapAnalysisRecord) => void;
  rulemakingProjects: Project[];
};

export function GapAnalysisForm({ onFormSubmit, rulemakingProjects }: GapAnalysisFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [casrOptions, setCasrOptions] = useState<ComboboxOption[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjects = async () => {
        const projectsSnapshot = await getDocs(collection(db, "rulemakingProjects"));
        const projectsFromDb = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        
        const uniqueCasrMap = new Map<string, { label: string; value: string }>();
        projectsFromDb.forEach(p => {
          if (p.casr) {
            const revision = p.casrRevision ? ` (Rev. ${p.casrRevision})` : '';
            const value = `CASR ${p.casr}${revision}`;
            if (!uniqueCasrMap.has(value)) {
              uniqueCasrMap.set(value, {
                value: value,
                label: `${value} - ${p.name}`
              });
            }
          }
        });
        
        setCasrOptions(Array.from(uniqueCasrMap.values()));
    };
    fetchProjects();
  }, []);

  const defaultFormValues: GapAnalysisFormValues = {
    slReferenceNumber: '',
    slReferenceDate: '',
    annex: '',
    typeOfStateLetter: '',
    dateOfEvaluation: '',
    subject: '',
    letterName: '',
    letterSubject: '',
    implementationDate: '',
    actionRequired: [
      { id: 'disapproval', checked: false, date: '' },
      { id: 'differences', checked: false, date: '' },
      { id: 'efod', checked: false, date: '' },
    ],
    effectiveDate: '',
    applicabilityDate: '',
    embeddedApplicabilityDate: '',
    evaluations: [
      { id: 'eval-1', icaoSarp: '', review: '', complianceStatus: 'No Differences', casrAffected: '', status: 'OPEN', followUp: '', proposedAmendment: '', reasonOrRemark: '' }
    ],
    statusItem: 'OPEN',
    summary: '',
    inspectors: [
        { id: 'inspector-1', name: '', signature: '' }
    ],
    verifiers: [
        { id: 'verifier-1', name: '', signature: '', date: '' }
    ],
    implementationTasks: [
        { id: 'task-1', description: '', estimatedComplianceDate: '' }
    ],
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
        <GapAnalysisSharedFormFields form={form} casrOptions={casrOptions} />
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

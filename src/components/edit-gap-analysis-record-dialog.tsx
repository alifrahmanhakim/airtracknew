

'use client';

import { useState, useEffect } from 'react';
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
import type { GapAnalysisRecord, Project, ActionRequiredItem, ImplementationTaskItem, Verifier } from '@/lib/types';
import { GapAnalysisSharedFormFields, type GapAnalysisFormValues } from './gap-analysis-shared-form-fields';
import { updateGapAnalysisRecord } from '@/lib/actions/gap-analysis';
import { ScrollArea } from './ui/scroll-area';
import { ComboboxOption } from './ui/combobox';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { gapAnalysisFormSchema as formSchema } from '@/lib/schemas';
import { format, parse, isValid } from 'date-fns';

type EditGapAnalysisRecordDialogProps = {
  record: GapAnalysisRecord;
  onRecordUpdate: (updatedRecord: GapAnalysisRecord) => void;
};

const actionRequiredIds: ActionRequiredItem['id'][] = ['disapproval', 'differences', 'efod'];

const formatToInputDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
        const date = parse(dateString, 'yyyy-MM-dd', new Date());
        if (isValid(date)) {
            return format(date, 'dd-MM-yyyy');
        }
        return dateString;
    } catch {
        return dateString;
    }
}

export function EditGapAnalysisRecordDialog({ record, onRecordUpdate }: EditGapAnalysisRecordDialogProps) {
  const [open, setOpen] = useState(false);
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

  const getActionRequiredDefault = () => {
    const defaultActions = [
      { id: 'disapproval', checked: false, date: '' },
      { id: 'differences', checked: false, date: '' },
      { id: 'efod', checked: false },
    ] as const;

    if (Array.isArray(record.actionRequired) && record.actionRequired.every(item => typeof item === 'object' && 'id' in item)) {
        return defaultActions.map(def => {
            const found = (record.actionRequired as ActionRequiredItem[]).find(rec => rec.id === def.id);
            return found ? { ...found, date: formatToInputDate(found.date) } : def;
        })
    }
    // Handle old string array format for backwards compatibility
    if (Array.isArray(record.actionRequired) && record.actionRequired.every(item => typeof item === 'string')) {
      return defaultActions.map(def => ({
        ...def,
        checked: (record.actionRequired as string[]).includes(def.id)
      }));
    }

    return defaultActions;
  };

  const form = useForm<GapAnalysisFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...record,
      dateOfEvaluation: formatToInputDate(record.dateOfEvaluation),
      implementationDate: formatToInputDate(record.implementationDate),
      effectiveDate: formatToInputDate(record.effectiveDate),
      applicabilityDate: formatToInputDate(record.applicabilityDate),
      embeddedApplicabilityDate: formatToInputDate(record.embeddedApplicabilityDate),
      actionRequired: getActionRequiredDefault(),
      inspectors: record.inspectors || [],
      verifiers: record.verifiers?.map(v => ({...v, date: formatToInputDate(v.date)})) || [],
      implementationTasks: record.implementationTasks?.map(t => ({...t, estimatedComplianceDate: formatToInputDate(t.estimatedComplianceDate)})) || [],
      evaluations: record.evaluations.map(e => ({
          ...e,
          followUp: e.followUp || '',
          proposedAmendment: e.proposedAmendment || '',
          reasonOrRemark: e.reasonOrRemark || '',
          status: e.status || 'OPEN',
      }))
    },
  });

  const onSubmit = async (data: GapAnalysisFormValues) => {
    setIsLoading(true);
    
    const result = await updateGapAnalysisRecord(record.id, data);

    setIsLoading(false);

    if (result.success && result.data) {
        onRecordUpdate(result.data);
        toast({
            title: 'Record Updated!',
            description: 'Your GAP Analysis record has been successfully updated.',
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
              <DialogTitle>Edit GAP Analysis Record</DialogTitle>
              <DialogDescription>
                Make changes to the record for SL Ref: <span className='font-semibold'>{record.slReferenceNumber}</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-grow overflow-y-auto pr-6 my-4">
                <div className="space-y-8">
                    <GapAnalysisSharedFormFields form={form} casrOptions={casrOptions} />
                </div>
            </div>

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

'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Save, Trash2, Pencil } from 'lucide-react';
import type { AdoptionDataPoint, Project } from '@/lib/types';
import { updateProject } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { Separator } from './ui/separator';

const adoptionDataPointSchema = z.object({
  sl: z.string().min(1, 'SL is required'),
  evaluated: z.coerce.number().min(0).default(0),
  notEvaluated: z.coerce.number().min(0).default(0),
  notFinishYet: z.coerce.number().min(0).default(0),
  totalSubject: z.coerce.number().min(0).default(0),
  standard: z.coerce.number().min(0).default(0),
  recommendation: z.coerce.number().min(0).default(0),
  existingInCasr: z.coerce.number().min(0).default(0),
  draftInCasr: z.coerce.number().min(0).default(0),
  belumDiAdop: z.coerce.number().min(0).default(0),
  tidakDiAdop: z.coerce.number().min(0).default(0),
  managementDecision: z.coerce.number().min(0).default(0),
  noDifference: z.coerce.number().min(0).default(0),
  moreExactingOrExceeds: z.coerce.number().min(0).default(0),
  differentInCharacter: z.coerce.number().min(0).default(0),
  lessProtective: z.coerce.number().min(0).default(0),
  significantDifference: z.coerce.number().min(0).default(0),
  notApplicable: z.coerce.number().min(0).default(0),
});

const adoptionDataSchema = z.object({
  adoptionData: z.array(adoptionDataPointSchema),
});

type AdoptionDataFormValues = z.infer<typeof adoptionDataSchema>;

type AdoptionDataEditorProps = {
  project: Project;
};

export function AdoptionDataEditor({ project }: AdoptionDataEditorProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AdoptionDataFormValues>({
    resolver: zodResolver(adoptionDataSchema),
    defaultValues: {
      adoptionData: project.adoptionData || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'adoptionData',
  });

  const onSubmit = async (data: AdoptionDataFormValues) => {
    setIsSubmitting(true);
    
    const result = await updateProject(project.id, { adoptionData: data.adoptionData });

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Compliance Data Updated',
        description: 'The compliance resume data has been saved successfully.',
      });
      setOpen(false);
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to update compliance data.',
      });
    }
  };

  const formGroups = [
      { title: 'Total Evaluation Status', fields: ['evaluated', 'notEvaluated', 'notFinishYet'] },
      { title: 'Total Subject & Status', fields: ['totalSubject', 'standard', 'recommendation'] },
      { title: 'Gap Status', fields: ['existingInCasr', 'draftInCasr', 'belumDiAdop', 'tidakDiAdop', 'managementDecision'] },
      { title: 'Level of Implementation', fields: ['noDifference', 'moreExactingOrExceeds', 'differentInCharacter', 'lessProtective', 'significantDifference', 'notApplicable'] },
  ];

  const fieldLabels: Record<string, string> = {
    evaluated: 'Evaluated', notEvaluated: 'Not Evaluated', notFinishYet: 'Not Finish Yet',
    totalSubject: 'Total Subject', standard: 'Standard', recommendation: 'Recommendation',
    existingInCasr: 'Existing in CASR', draftInCasr: 'Draft in CASR', belumDiAdop: 'Belum Diadop', tidakDiAdop: 'Tidak Diadop', managementDecision: 'Management Decision',
    noDifference: 'No Difference', moreExactingOrExceeds: 'More Exacting', differentInCharacter: 'Different Character', lessProtective: 'Less Protective', significantDifference: 'Significant Difference', notApplicable: 'Not Applicable'
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="mr-2 h-4 w-4" />
          Edit Compliance Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Compliance Resume Data</DialogTitle>
          <DialogDescription>
            Manage the State Letter (SL) data points for Annex {project.annex} to CASR {project.casr}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <ScrollArea className="flex-grow pr-6">
                <div className="space-y-6">
                {fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <FormField
                                control={form.control}
                                name={`adoptionData.${index}.sl`}
                                render={({ field }) => (
                                    <FormItem className="w-1/4">
                                    <FormLabel>State Letter (SL)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., SL 172" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <Separator className="my-4" />

                        {formGroups.map(group => (
                            <div key={group.title} className="mb-4">
                                <h4 className="font-semibold text-md mb-2">{group.title}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {group.fields.map(fieldName => (
                                    <FormField
                                        key={fieldName}
                                        control={form.control}
                                        name={`adoptionData.${index}.${fieldName as keyof AdoptionDataPoint}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">{fieldLabels[fieldName]}</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                                </div>
                            </div>
                        ))}
                    </Card>
                ))}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => append({ sl: '', evaluated: 0, notEvaluated: 0, notFinishYet: 0, totalSubject: 0, standard: 0, recommendation: 0, existingInCasr: 0, draftInCasr: 0, belumDiAdop: 0, tidakDiAdop: 0, managementDecision: 0, noDifference: 0, moreExactingOrExceeds: 0, differentInCharacter: 0, lessProtective: 0, significantDifference: 0, notApplicable: 0})}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add State Letter
                </Button>
            </ScrollArea>
            <DialogFooter className="pt-4 mt-auto border-t">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

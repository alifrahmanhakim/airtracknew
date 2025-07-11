
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
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Save, Trash2, Pencil } from 'lucide-react';
import type { ComplianceDataRow, Project } from '@/lib/types';
import { updateProject } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const complianceDataRowSchema = z.object({
    id: z.string(),
    sl: z.string().min(1, 'SL is required'),
    subject: z.string().min(1, 'Subject is required'),
    evaluationStatus: z.enum(['Evaluated', 'Not Evaluated', 'Not Finish Yet']),
    subjectStatus: z.enum(['Standard', 'Recommendation', 'Not Applicable']),
    gapStatus: z.enum(['Existing in CASR', 'Draft in CASR', 'Belum Diadop', 'Tidak Diadop', 'Management Decision', 'Not Applicable']),
    implementationLevel: z.enum(['No Difference', 'More Exacting or Exceeds', 'Different in Character', 'Less Protective', 'Significant Difference', 'Not Applicable']),
});

const complianceDataSchema = z.object({
  complianceData: z.array(complianceDataRowSchema),
});

type ComplianceDataFormValues = z.infer<typeof complianceDataSchema>;

type ComplianceDataEditorProps = {
  project: Project;
};

const statusOptions = {
    evaluationStatus: ['Evaluated', 'Not Evaluated', 'Not Finish Yet'],
    subjectStatus: ['Standard', 'Recommendation', 'Not Applicable'],
    gapStatus: ['Existing in CASR', 'Draft in CASR', 'Belum Diadop', 'Tidak Diadop', 'Management Decision', 'Not Applicable'],
    implementationLevel: ['No Difference', 'More Exacting or Exceeds', 'Different in Character', 'Less Protective', 'Significant Difference', 'Not Applicable'],
};

export function ComplianceDataEditor({ project }: ComplianceDataEditorProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ComplianceDataFormValues>({
    resolver: zodResolver(complianceDataSchema),
    defaultValues: {
      complianceData: project.complianceData || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'complianceData',
  });

  const onSubmit = async (data: ComplianceDataFormValues) => {
    setIsSubmitting(true);
    
    const result = await updateProject(project.id, { complianceData: data.complianceData });

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Compliance Data Updated',
        description: 'The compliance data has been saved successfully.',
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
          <DialogTitle>Edit Compliance Data</DialogTitle>
          <DialogDescription>
            Manage the State Letter (SL) compliance data for Annex {project.annex} to CASR {project.casr}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <ScrollArea className="flex-grow pr-4">
              <Table>
                <TableHeader className='sticky top-0 bg-background'>
                  <TableRow>
                    <TableHead className='w-[150px]'>State Letter (SL)</TableHead>
                    <TableHead className='w-[200px]'>Subject</TableHead>
                    <TableHead>Evaluation Status</TableHead>
                    <TableHead>Subject Status</TableHead>
                    <TableHead>Gap Status</TableHead>
                    <TableHead>Implementation Level</TableHead>
                    <TableHead className='w-[50px]'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                        <TableCell>
                            <Controller name={`complianceData.${index}.sl`} control={form.control} render={({ field }) => <Input {...field} />} />
                        </TableCell>
                        <TableCell>
                            <Controller name={`complianceData.${index}.subject`} control={form.control} render={({ field }) => <Input {...field} />} />
                        </TableCell>
                        
                        {(['evaluationStatus', 'subjectStatus', 'gapStatus', 'implementationLevel'] as const).map(col => (
                            <TableCell key={col}>
                                <Controller
                                    name={`complianceData.${index}.${col}`}
                                    control={form.control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                            {statusOptions[col].map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </TableCell>
                        ))}

                        <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
             <div className="pt-4 mt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ id: `row-${Date.now()}`, sl: '', subject: '', evaluationStatus: 'Not Evaluated', subjectStatus: 'Not Applicable', gapStatus: 'Not Applicable', implementationLevel: 'Not Applicable' })}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Row
                </Button>
            </div>
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

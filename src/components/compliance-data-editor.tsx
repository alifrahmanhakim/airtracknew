
'use client';

import { useState, useMemo } from 'react';
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
import { Loader2, Plus, Save, Trash2, Pencil, ArrowUpDown, Search, Package } from 'lucide-react';
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
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';

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

type SortDescriptor = {
    column: keyof ComplianceDataRow;
    direction: 'asc' | 'desc';
} | null;


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

  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<SortDescriptor>(null);
  const [isGrouped, setIsGrouped] = useState(true);

  const form = useForm<ComplianceDataFormValues>({
    resolver: zodResolver(complianceDataSchema),
    defaultValues: {
      complianceData: project.complianceData || [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'complianceData',
  });
  
  const handleSort = (column: keyof ComplianceDataRow) => {
    setSort(prevSort => {
        if (prevSort?.column === column) {
            return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { column, direction: 'asc' };
    });
  }
  
  const processedData = useMemo(() => {
    let data = [...fields.map((field, index) => ({ ...field, originalIndex: index }))];

    if (filter) {
        data = data.filter(item => 
            item.sl.toLowerCase().includes(filter.toLowerCase()) ||
            item.subject.toLowerCase().includes(filter.toLowerCase())
        );
    }

    if (sort) {
        data.sort((a, b) => {
            const aVal = a[sort.column];
            const bVal = b[sort.column];
            if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    if (isGrouped) {
        const grouped = data.reduce((acc, item) => {
            (acc[item.sl] = acc[item.sl] || []).push(item);
            return acc;
        }, {} as Record<string, typeof data>);
        
        return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    }

    return data;
  }, [fields, filter, sort, isGrouped]);


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

  const renderSortIcon = (column: keyof ComplianceDataRow) => {
      if (sort?.column !== column) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
      return sort.direction === 'asc' ? <ArrowUpDown className="h-4 w-4 ml-2" /> : <ArrowUpDown className="h-4 w-4 ml-2" />;
  }

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
            <div className="flex items-center justify-between py-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Filter by SL or Subject..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="group-by-sl" checked={isGrouped} onCheckedChange={setIsGrouped} />
                    <Label htmlFor="group-by-sl">Group by SL</Label>
                </div>
            </div>

            <ScrollArea className="flex-grow pr-4 border rounded-md">
              <Table>
                <TableHeader className='sticky top-0 bg-muted/50 z-10'>
                  <TableRow>
                    <TableHead className='w-[150px] cursor-pointer' onClick={() => handleSort('sl')}>
                        <div className="flex items-center">State Letter (SL) {renderSortIcon('sl')}</div>
                    </TableHead>
                    <TableHead className='w-[200px] cursor-pointer' onClick={() => handleSort('subject')}>
                         <div className="flex items-center">Subject {renderSortIcon('subject')}</div>
                    </TableHead>
                    <TableHead>Evaluation Status</TableHead>
                    <TableHead>Subject Status</TableHead>
                    <TableHead>Gap Status</TableHead>
                    <TableHead>Implementation Level</TableHead>
                    <TableHead className='w-[50px]'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isGrouped ? (
                      (processedData as [string, (typeof fields[0] & { originalIndex: number })[]][]).map(([sl, items]) => (
                          <React.Fragment key={sl}>
                            <TableRow className="bg-muted/30 hover:bg-muted/40">
                                <TableCell colSpan={7} className="font-semibold text-primary">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        {sl} ({items.length} items)
                                    </div>
                                </TableCell>
                            </TableRow>
                            {items.map(field => (
                                <TableRow key={field.id}>
                                     <TableCell></TableCell>
                                     <TableCell>
                                         <Controller name={`complianceData.${field.originalIndex}.subject`} control={form.control} render={({ field }) => <Input {...field} />} />
                                     </TableCell>
                                     {(['evaluationStatus', 'subjectStatus', 'gapStatus', 'implementationLevel'] as const).map(col => (
                                         <TableCell key={col}>
                                             <Controller
                                                 name={`complianceData.${field.originalIndex}.${col}`}
                                                 control={form.control}
                                                 render={({ field: controllerField }) => (
                                                     <Select onValueChange={controllerField.onChange} value={controllerField.value}>
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
                                         <Button type="button" variant="ghost" size="icon" onClick={() => remove(field.originalIndex)}>
                                             <Trash2 className="h-4 w-4 text-destructive" />
                                         </Button>
                                     </TableCell>
                                </TableRow>
                            ))}
                          </React.Fragment>
                      ))
                  ) : (
                    (processedData as (typeof fields[0] & { originalIndex: number })[]).map((field) => (
                        <TableRow key={field.id}>
                            <TableCell>
                                <Controller name={`complianceData.${field.originalIndex}.sl`} control={form.control} render={({ field: controllerField }) => <Input {...controllerField} />} />
                            </TableCell>
                            <TableCell>
                                <Controller name={`complianceData.${field.originalIndex}.subject`} control={form.control} render={({ field: controllerField }) => <Input {...controllerField} />} />
                            </TableCell>
                            
                            {(['evaluationStatus', 'subjectStatus', 'gapStatus', 'implementationLevel'] as const).map(col => (
                                <TableCell key={col}>
                                    <Controller
                                        name={`complianceData.${field.originalIndex}.${col}`}
                                        control={form.control}
                                        render={({ field: controllerField }) => (
                                            <Select onValueChange={controllerField.onChange} value={controllerField.value}>
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
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(field.originalIndex)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                  )}
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

    
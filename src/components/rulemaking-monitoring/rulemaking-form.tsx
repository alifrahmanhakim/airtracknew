
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { rulemakingRecordSchema } from '@/lib/schemas';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, File, Calendar, PenSquare, Info } from 'lucide-react';
import { addRulemakingRecord, updateRulemakingRecord } from '@/lib/actions/rulemaking';
import type { RulemakingRecord } from '@/lib/types';
import { Combobox, type ComboboxOption } from '../ui/combobox';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type RulemakingFormValues = z.infer<typeof rulemakingRecordSchema>;

type RulemakingFormProps = {
  record?: RulemakingRecord;
  onFormSubmit: (data: RulemakingRecord) => void;
};

const STAGE_COLORS = [
    'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800/50',
    'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50',
    'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50',
    'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50',
];

export function RulemakingForm({ record, onFormSubmit }: RulemakingFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [perihalOptions, setPerihalOptions] = React.useState<ComboboxOption[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, 'rulemakingRecords'), (snapshot) => {
        const uniquePerihal = new Set<string>();
        snapshot.docs.forEach(doc => {
            const data = doc.data() as RulemakingRecord;
            if (data.perihal) {
                uniquePerihal.add(data.perihal);
            }
        });
        setPerihalOptions(Array.from(uniquePerihal).map(p => ({ value: p, label: p })));
    });
    return () => unsub();
  }, []);

  const form = useForm<RulemakingFormValues>({
    resolver: zodResolver(rulemakingRecordSchema),
    defaultValues: record ? {
        ...record,
        stages: record.stages.map(stage => ({
          pengajuan: {
            tanggal: stage.pengajuan.tanggal || '',
            nomor: stage.pengajuan.nomor || '',
            keteranganPengajuan: stage.pengajuan.keteranganPengajuan || '',
            fileUrl: stage.pengajuan.fileUrl || ''
          },
          status: {
            deskripsi: stage.status.deskripsi || ''
          },
          keterangan: {
            text: stage.keterangan?.text || ''
          }
        }))
    } : {
      perihal: '',
      kategori: 'PKPS/CASR',
      stages: [{
          pengajuan: { tanggal: '', nomor: '', keteranganPengajuan: '', fileUrl: '' },
          status: { deskripsi: '' },
          keterangan: { text: '' }
      }],
    },
  });

  const { fields: stageFields, append: appendStage, remove: removeStage } = useFieldArray({
    control: form.control,
    name: 'stages',
  });

  const onSubmit = async (data: RulemakingFormValues) => {
    setIsLoading(true);
    const result = record
      ? await updateRulemakingRecord(record.id, data)
      : await addRulemakingRecord(data);
    
    setIsLoading(false);

    if (result.success) {
      toast({
        title: `Record ${record ? 'Updated' : 'Added'}`,
        description: `The record for "${data.perihal}" has been saved.`,
      });
      if (result.data) {
        onFormSubmit(result.data);
      }
      if (!record) form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
  };

  return (
    <Form {...form}>
      <form id={record ? `rulemaking-form-${record.id}` : 'rulemaking-form'} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="perihal"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Perihal</FormLabel>
                <Combobox
                    options={perihalOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select or type a Perihal..."
                />
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="kategori"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="PKPS/CASR">PKPS/CASR</SelectItem>
                            <SelectItem value="SI">SI</SelectItem>
                            <SelectItem value="AC">AC</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <Card className="bg-transparent">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Stages</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => appendStage({ pengajuan: { tanggal: '', nomor: '', keteranganPengajuan: '', fileUrl: '' }, status: { deskripsi: '' }, keterangan: { text: '' }})}>
                    <Plus className="mr-2 h-4 w-4" /> Add Stage
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {stageFields.map((field, index) => (
                    <Card key={field.id} className={`${STAGE_COLORS[index % STAGE_COLORS.length]} shadow-sm hover:shadow-md transition-shadow`}>
                        <CardHeader className="flex-row items-start justify-between pb-2">
                             <h4 className="font-bold text-lg text-foreground">Stage {index + 1}</h4>
                            {stageFields.length > 1 && <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => removeStage(index)}><Trash2 className="h-4 w-4" /></Button>}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <fieldset className="border p-4 rounded-md">
                                <legend className="text-sm font-medium px-1 flex items-center gap-2">
                                    <PenSquare className="h-4 w-4" /> Detail Pengajuan
                                </legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <FormField control={form.control} name={`stages.${index}.pengajuan.tanggal`} render={({ field }) => (<FormItem><FormLabel>Tanggal</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name={`stages.${index}.pengajuan.nomor`} render={({ field }) => (<FormItem><FormLabel>No. Surat</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={form.control} name={`stages.${index}.pengajuan.keteranganPengajuan`} render={({ field }) => (<FormItem className="mt-4"><FormLabel>Keterangan Pengajuan</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name={`stages.${index}.pengajuan.fileUrl`} render={({ field }) => (<FormItem className="mt-4"><FormLabel>Attachment Link</FormLabel><FormControl><Input type="url" placeholder="https://example.com/file.pdf" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </fieldset>
                            <FormField control={form.control} name={`stages.${index}.status.deskripsi`} render={({ field }) => (<FormItem><FormLabel>Deskripsi Status</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`stages.${index}.keterangan.text`} render={({ field }) => (<FormItem><FormLabel>Keterangan</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
        </Card>
        
        {!record && (
            <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => form.reset()}>Close</Button>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {record ? 'Save Changes' : 'Submit Record'}
            </Button>
            </div>
        )}
      </form>
    </Form>
  );
}

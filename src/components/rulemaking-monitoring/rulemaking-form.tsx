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
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { addRulemakingRecord, updateRulemakingRecord } from '@/lib/actions/rulemaking';
import type { RulemakingRecord } from '@/lib/types';
import { Combobox, type ComboboxOption } from '../ui/combobox';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type RulemakingFormValues = z.infer<typeof rulemakingRecordSchema>;

type RulemakingFormProps = {
  record?: RulemakingRecord;
  onFormSubmit: () => void;
};

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
    } : {
      perihal: '',
      stages: [{
          pengajuan: { tanggal: '', nomor: '' },
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
      onFormSubmit();
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
        
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Pengajuan</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => appendStage({ pengajuan: { tanggal: '', nomor: '' }, status: { deskripsi: '' }, keterangan: { text: '' }})}>
                    <Plus className="mr-2 h-4 w-4" /> Add Pengajuan
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {stageFields.map((field, index) => (
                    <div key={field.id} className="border p-4 rounded-lg relative">
                        <h4 className="font-semibold mb-2">Pengajuan {index + 1}</h4>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name={`stages.${index}.pengajuan.tanggal`} render={({ field }) => (<FormItem><FormLabel>Tanggal Pengajuan</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name={`stages.${index}.pengajuan.nomor`} render={({ field }) => (<FormItem><FormLabel>Nomor Pengajuan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name={`stages.${index}.status.deskripsi`} render={({ field }) => (<FormItem><FormLabel>Deskripsi Status</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`stages.${index}.keterangan.text`} render={({ field }) => (<FormItem><FormLabel>Keterangan</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        {stageFields.length > 1 && <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeStage(index)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                ))}
            </CardContent>
        </Card>


        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {record ? 'Save Changes' : 'Submit Record'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

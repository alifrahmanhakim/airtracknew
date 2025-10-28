
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
      pengajuan: [{ tanggal: '', nomor: '' }],
      status: [{ deskripsi: '' }],
      keterangan: [],
    },
  });

  const { fields: pengajuanFields, append: appendPengajuan, remove: removePengajuan } = useFieldArray({ control: form.control, name: 'pengajuan' });
  const { fields: statusFields, append: appendStatus, remove: removeStatus } = useFieldArray({ control: form.control, name: 'status' });
  const { fields: keteranganFields, append: appendKeterangan, remove: removeKeterangan } = useFieldArray({ control: form.control, name: 'keterangan' });

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
                <Button type="button" variant="outline" size="sm" onClick={() => appendPengajuan({ tanggal: '', nomor: '' })}>
                    <Plus className="mr-2 h-4 w-4" /> Add Pengajuan
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {pengajuanFields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md relative">
                        <FormField control={form.control} name={`pengajuan.${index}.tanggal`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Tanggal</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`pengajuan.${index}.nomor`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Nomor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        {pengajuanFields.length > 1 && <Button type="button" variant="destructive" size="icon" onClick={() => removePengajuan(index)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                ))}
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Status</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => appendStatus({ deskripsi: '' })}>
                    <Plus className="mr-2 h-4 w-4" /> Add Status
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {statusFields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md relative">
                        <FormField control={form.control} name={`status.${index}.deskripsi`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Deskripsi Status</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                        {statusFields.length > 1 && <Button type="button" variant="destructive" size="icon" onClick={() => removeStatus(index)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                ))}
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Keterangan</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => appendKeterangan({ text: '' })}>
                    <Plus className="mr-2 h-4 w-4" /> Add Keterangan
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {keteranganFields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md relative">
                        <FormField control={form.control} name={`keterangan.${index}.text`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Keterangan</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                        {keteranganFields.length > 1 && <Button type="button" variant="destructive" size="icon" onClick={() => removeKeterangan(index)}><Trash2 className="h-4 w-4" /></Button>}
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


'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
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
import { Loader2 } from 'lucide-react';
import { addRulemakingRecord, updateRulemakingRecord } from '@/lib/actions/rulemaking';
import type { RulemakingRecord } from '@/lib/types';
import { format, parse } from 'date-fns';

type RulemakingFormValues = z.infer<typeof rulemakingRecordSchema>;

type RulemakingFormProps = {
  record?: RulemakingRecord;
  onFormSubmit: () => void;
};

export function RulemakingForm({ record, onFormSubmit }: RulemakingFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<RulemakingFormValues>({
    resolver: zodResolver(rulemakingRecordSchema),
    defaultValues: record ? {
        ...record,
        pengajuan: {
            ...record.pengajuan,
            tanggal: record.pengajuan.tanggal ? format(parse(record.pengajuan.tanggal, 'd MMMM yyyy', new Date()), 'yyyy-MM-dd') : '',
        },
        status: {
            ...record.status,
            tanggalSurat: record.status.tanggalSurat ? format(parse(record.status.tanggalSurat, 'd MMMM yyyy', new Date()), 'yyyy-MM-dd') : '',
        }
    } : {
      perihal: '',
      pengajuan: { tanggal: '', nomor: '' },
      status: { deskripsi: '', nomorSurat: '', tanggalSurat: '' },
      keterangan: '',
    },
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
            <FormItem>
              <FormLabel>Perihal</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="pengajuan.tanggal"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Tanggal Pengajuan</FormLabel>
                <FormControl>
                    <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="pengajuan.nomor"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nomor Pengajuan</FormLabel>
                <FormControl>
                    <Input {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="status.deskripsi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi Status</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
            control={form.control}
            name="status.nomorSurat"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nomor Surat Status</FormLabel>
                <FormControl>
                    <Input {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="status.tanggalSurat"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Tanggal Surat Status</FormLabel>
                <FormControl>
                    <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="keterangan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keterangan</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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

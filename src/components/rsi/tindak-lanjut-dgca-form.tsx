
'use client';

import { useForm, type UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '../ui/textarea';
import type { z } from 'zod';
import { tindakLanjutDgcaFormSchema } from '@/lib/schemas';

type TindakLanjutDgcaFormValues = z.infer<typeof tindakLanjutDgcaFormSchema>;

type TindakLanjutDgcaFormProps = {
  form: UseFormReturn<TindakLanjutDgcaFormValues>;
};

export function TindakLanjutDgcaForm({ form }: TindakLanjutDgcaFormProps) {
    
  return (
    <Form {...form}>
      <form id="tindak-lanjut-dgca-form" className="space-y-6">
        <FormField
          control={form.control}
          name="laporanInvestigasi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Laporan Investigasi KNKT</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Final Report KNKT.24.01.02.04..." rows={6} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rekomendasiKeDgca"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rekomendasi Keselamatan Ke DGCA</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Tidak Ada" rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nomorRekomendasi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor Rekomendasi Keselamatan</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., -" rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tindakLanjutDkppu"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tindak lanjut DKPPU</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., -" rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

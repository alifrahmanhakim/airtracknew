
'use client';

import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export const formSchema = z.object({
  tsu: z.string().min(1, 'TSU is required'),
  tsa: z.string().min(1, 'TSA is required'),
  editing: z.string().min(1, 'Editing is required'),
  makna: z.string().min(1, 'Makna is required'),
  keterangan: z.string().min(1, 'Keterangan / Pengaplikasian is required'),
  status: z.enum(['Draft', 'Final']),
});

export type GlossaryFormValues = z.infer<typeof formSchema>;

type GlossarySharedFormFieldsProps = {
  form: UseFormReturn<GlossaryFormValues>;
};

export function GlossarySharedFormFields({ form }: GlossarySharedFormFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="tsu"
        render={({ field }) => (
          <FormItem>
            <FormLabel>TSU (Teks Sumber)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Masukkan teks sumber (TSU) di sini..."
                rows={4}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="tsa"
        render={({ field }) => (
          <FormItem>
            <FormLabel>TSA (Teks Sasaran)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Masukkan teks sasaran (TSA) di sini..."
                rows={4}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="editing"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Editing (Teks yang sudah disunting)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Masukkan teks yang sudah disunting di sini..."
                rows={4}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="makna"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Makna</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Jelaskan makna dari hasil terjemahan di sini..."
                rows={4}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
       <FormField
        control={form.control}
        name="keterangan"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Keterangan / Pengaplikasian</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Jelaskan keterangan atau cara pengaplikasian di sini..."
                rows={4}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
       <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
             <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Pilih status..." /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                </SelectContent>
              </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

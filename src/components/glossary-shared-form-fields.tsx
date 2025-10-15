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
import { Button } from './ui/button';
import { Languages, Loader2 } from 'lucide-react';

export const formSchema = z.object({
  tsu: z.string().min(1, 'TSU is required'),
  tsa: z.string().min(1, 'TSA is required'),
  editing: z.string().min(1, 'Editing is required'),
  makna: z.string().min(1, 'Makna is required'),
  keterangan: z.string().min(1, 'Keterangan / Pengaplikasian is required'),
  referensi: z.string().optional(),
  status: z.enum(['Draft', 'Final', 'Usulan']),
});

export type GlossaryFormValues = z.infer<typeof formSchema>;

type GlossarySharedFormFieldsProps = {
  form: UseFormReturn<GlossaryFormValues>;
  onTranslate: () => void;
  isTranslating: boolean;
};

export function GlossarySharedFormFields({ form, onTranslate, isTranslating }: GlossarySharedFormFieldsProps) {
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

       <div className="relative">
          <FormField
            control={form.control}
            name="tsa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TSA (Teks Sasaran)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Hasil terjemahan akan muncul di sini..."
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-0 right-0"
              onClick={onTranslate}
              disabled={isTranslating}
            >
              {isTranslating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Languages className="mr-2 h-4 w-4" />
              )}
              Translate with AI
            </Button>
       </div>

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
        name="referensi"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Referensi / Daftar Pustaka</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Masukkan sumber referensi atau daftar pustaka di sini..."
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
                  <SelectItem value="Usulan">Usulan</SelectItem>
                </SelectContent>
              </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

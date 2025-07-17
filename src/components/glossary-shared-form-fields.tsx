
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const formSchema = z.object({
  term: z.string().min(1, 'Term is required'),
  definition: z.string().min(1, 'Definition is required'),
  source: z.string().min(1, 'Source is required'),
  tags: z.string().optional(),
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
        name="term"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Term</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Aerodrome" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="definition"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Definition</FormLabel>
            <FormControl>
              <Textarea
                placeholder="A defined area on land or water..."
                rows={5}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="source"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Source</FormLabel>
            <FormControl>
              <Input placeholder="e.g., ICAO Annex 14" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tags (comma-separated)</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Operations, Aerodromes" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

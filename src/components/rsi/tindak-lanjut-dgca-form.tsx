
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
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';

type TindakLanjutDgcaFormValues = z.infer<typeof tindakLanjutDgcaFormSchema>;

type TindakLanjutDgcaFormProps = {
  form: UseFormReturn<TindakLanjutDgcaFormValues>;
};

export function TindakLanjutDgcaForm({ form }: TindakLanjutDgcaFormProps) {
    
  return (
    <Form {...form}>
      <form id="tindak-lanjut-dgca-form" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="judulLaporan"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Judul Laporan</FormLabel>
                    <FormControl>
                    <Input placeholder="Judul laporan KNKT..." {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="nomorLaporan"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Nomor Laporan</FormLabel>
                    <FormControl>
                    <Input placeholder="Nomor laporan KNKT..." {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="tanggalKejadian"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Kejadian</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pilih tanggal</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="tanggalTerbit"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Terbit</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pilih tanggal</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
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

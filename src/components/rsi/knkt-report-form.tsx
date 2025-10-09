

'use client';

import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { knktReportFormSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Combobox } from '../ui/combobox';
import { Textarea } from '../ui/textarea';
import { aocOptions, indonesianAircraftTypes, taxonomyOptions } from '@/lib/data';
import { Button } from '../ui/button';

type KnktReportFormValues = z.infer<typeof knktReportFormSchema>;

type KnktReportFormProps = {
  form: UseFormReturn<KnktReportFormValues>;
};

export function KnktReportForm({ form }: KnktReportFormProps) {

  return (
    <Form {...form}>
      <form id="knkt-report-form" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField control={form.control} name="tanggal_diterbitkan" render={({ field }) => (
                <FormItem>
                    <FormLabel>Tanggal Diterbitkan</FormLabel>
                    <FormControl>
                        <Input type="text" placeholder="YYYY-MM-DD" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
             <FormField control={form.control} name="nomor_laporan" render={({ field }) => (<FormItem><FormLabel>Nomor Laporan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
             <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih status..." /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Final">Final</SelectItem>
                            <SelectItem value="Preliminary">Preliminary</SelectItem>
                            <SelectItem value="Interim Statement">Interim Statement</SelectItem>
                            <SelectItem value="Draft Final">Draft Final</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}/>
             <FormField control={form.control} name="operator" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Operator</FormLabel>
                     <Combobox 
                        options={aocOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Pilih atau ketik operator..."
                    />
                    <FormMessage />
                </FormItem>
            )}/>
             <FormField control={form.control} name="registrasi" render={({ field }) => (<FormItem><FormLabel>Registrasi</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
             <FormField control={form.control} name="tipe_pesawat" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Tipe Pesawat</FormLabel>
                     <Combobox 
                        options={indonesianAircraftTypes}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Pilih atau ketik tipe pesawat..."
                    />
                    <FormMessage />
                </FormItem>
             )}/>
             <FormField control={form.control} name="lokasi" render={({ field }) => (<FormItem><FormLabel>Lokasi</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
             <FormField control={form.control} name="taxonomy" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Taxonomy</FormLabel>
                     <Combobox 
                        options={taxonomyOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Pilih atau ketik taxonomy..."
                    />
                    <FormMessage />
                </FormItem>
             )}/>
             <FormField
                control={form.control}
                name="fileUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Embedded Link (File)</FormLabel>
                        <FormControl><Input type="url" placeholder="https://example.com/file.pdf" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField control={form.control} name="keterangan" render={({ field }) => (
            <FormItem>
                <FormLabel>Keterangan</FormLabel>
                <FormControl><Textarea rows={4} {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )}/>
      </form>
    </Form>
  );
}


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
import { accidentIncidentFormSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Combobox, ComboboxOption } from '../ui/combobox';
import { Textarea } from '../ui/textarea';
import { indonesianAircraftTypes, aocOptions, taxonomyOptions } from '@/lib/data';
import { Button } from '../ui/button';

type AccidentIncidentFormValues = z.infer<typeof accidentIncidentFormSchema>;

type AccidentIncidentFormProps = {
  form: UseFormReturn<AccidentIncidentFormValues>;
  onSubmit: (data: AccidentIncidentFormValues) => void;
};

export function AccidentIncidentForm({ form, onSubmit }: AccidentIncidentFormProps) {
  
  const watchAdaKorban = form.watch('adaKorbanJiwa');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="accident-incident-form">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="tanggal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="YYYY-MM-DD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="kategori" render={({ field }) => (
                <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Accident (A)">Accident (A)</SelectItem>
                            <SelectItem value="Serious Incident (SI)">Serious Incident (SI)</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}/>
             <FormField control={form.control} name="aoc" render={({ field }) => (
                 <FormItem className="flex flex-col">
                    <FormLabel>AOC</FormLabel>
                     <Combobox 
                        options={aocOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select or type an AOC..."
                    />
                    <FormMessage />
                </FormItem>
            )}/>
             <FormField control={form.control} name="registrasiPesawat" render={({ field }) => (<FormItem><FormLabel>Registrasi Pesawat</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
             <FormField control={form.control} name="tipePesawat" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Tipe Pesawat</FormLabel>
                     <Combobox 
                        options={indonesianAircraftTypes}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select or type an aircraft..."
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
                        placeholder="Select or type a taxonomy..."
                    />
                    <FormMessage />
                </FormItem>
             )}/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="keteranganKejadian" render={({ field }) => (
                <FormItem>
                    <FormLabel>Keterangan Kejadian</FormLabel>
                    <FormControl><Textarea rows={4} {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
            <div className='space-y-4'>
                <FormField control={form.control} name="adaKorbanJiwa" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Korban Jiwa</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih status korban..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Tidak Ada">Tidak Ada</SelectItem>
                                <SelectItem value="Ada">Ada</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>
                {watchAdaKorban === 'Ada' && (
                     <FormField control={form.control} name="jumlahKorbanJiwa" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Jumlah & Rincian Korban</FormLabel>
                            <FormControl><Input {...field} placeholder="e.g., 2 orang (1 pilot, 1 penumpang)" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                )}
            </div>
        </div>
      </form>
    </Form>
  );
}

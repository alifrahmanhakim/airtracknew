
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { accidentIncidentFormSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { addAccidentIncidentRecord } from '@/lib/actions/accident-incident';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Combobox, ComboboxOption } from '../ui/combobox';
import { Textarea } from '../ui/textarea';
import { indonesianAircraftTypes, aocOptions } from '@/lib/data';

type AccidentIncidentFormValues = z.infer<typeof accidentIncidentFormSchema>;

type AccidentIncidentFormProps = {
  onFormSubmit: () => void;
  operatorOptions: ComboboxOption[];
};

export function AccidentIncidentForm({ onFormSubmit, operatorOptions }: AccidentIncidentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AccidentIncidentFormValues>({
    resolver: zodResolver(accidentIncidentFormSchema),
    defaultValues: {
      operator: '',
      aoc: '',
      registrasiPesawat: '',
      tipePesawat: '',
      lokasi: '',
      wilayah: '',
      taxonomy: '',
      keteranganKejadian: '',
      korbanJiwa: '',
    },
  });

  const onSubmit = async (data: AccidentIncidentFormValues) => {
    setIsLoading(true);
    const result = await addAccidentIncidentRecord(data);
    setIsLoading(false);

    if (result.success) {
        toast({ title: 'Record Added', description: 'The new record has been successfully added.' });
        form.reset();
        onFormSubmit();
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to add the record.',
        });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField control={form.control} name="tanggal" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Tanggal</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
            )}/>
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
             <FormField control={form.control} name="operator" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Operator</FormLabel>
                    <Combobox 
                        options={operatorOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select or type an operator..."
                    />
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
             <FormField control={form.control} name="wilayah" render={({ field }) => (<FormItem><FormLabel>Wilayah</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
             <FormField control={form.control} name="taxonomy" render={({ field }) => (<FormItem><FormLabel>Taxonomy</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="keteranganKejadian" render={({ field }) => (
                <FormItem>
                    <FormLabel>Keterangan Kejadian</FormLabel>
                    <FormControl><Textarea rows={4} {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="korbanJiwa" render={({ field }) => (
                <FormItem>
                    <FormLabel>Korban Jiwa</FormLabel>
                    <FormControl><Textarea rows={4} {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Record
          </Button>
        </div>
      </form>
    </Form>
  );
}

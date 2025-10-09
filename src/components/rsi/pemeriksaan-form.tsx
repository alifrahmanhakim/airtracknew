
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
import { CalendarIcon } from 'lucide-react';
import { pemeriksaanFormSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type PemeriksaanFormValues = z.infer<typeof pemeriksaanFormSchema>;

type PemeriksaanFormProps = {
  form: UseFormReturn<PemeriksaanFormValues>;
};

export function PemeriksaanForm({ form }: PemeriksaanFormProps) {
  
  return (
    <Form {...form}>
      <form id="pemeriksaan-form" className="space-y-6">
        <Card className="p-4">
            <CardHeader>
                <CardTitle className="text-xl">Kejadian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="kategori" render={({ field }) => (<FormItem><FormLabel>Kategori</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="jenisPesawat" render={({ field }) => (<FormItem><FormLabel>Jenis Pesawat</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="registrasi" render={({ field }) => (<FormItem><FormLabel>Registrasi</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="tahunPembuatan" render={({ field }) => (<FormItem><FormLabel>Tahun Pembuatan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="operator" render={({ field }) => (<FormItem><FormLabel>Operator</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
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
                    <FormField control={form.control} name="lokasi" render={({ field }) => (<FormItem><FormLabel>Lokasi</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="korban" render={({ field }) => (<FormItem><FormLabel>Korban</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </div>
                <FormField control={form.control} name="ringkasanKejadian" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ringkasan Kejadian</FormLabel>
                        <FormControl><Textarea rows={5} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </CardContent>
        </Card>
        
        <Card className="p-4">
             <CardHeader>
                <CardTitle className="text-xl">Detail Pemeriksaan</CardTitle>
            </CardHeader>
             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="statusPenanganan" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status Penanganan</FormLabel>
                        <FormControl><Textarea placeholder="Gunakan tanda '-' untuk membuat bullet points" rows={8} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="tindakLanjut" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tindak Lanjut</FormLabel>
                        <FormControl><Textarea placeholder="Gunakan tanda '-' untuk membuat bullet points" rows={8} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
             </CardContent>
        </Card>
        
        <Card className="p-4">
             <CardHeader>
                <CardTitle className="text-xl">File</CardTitle>
            </CardHeader>
            <CardContent>
                 <FormField control={form.control} name="filePemeriksaanUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>File Pemeriksaan URL</FormLabel>
                        <FormControl><Input type="url" placeholder="https://example.com/file.pdf" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </CardContent>
        </Card>
      </form>
    </Form>
  );
}

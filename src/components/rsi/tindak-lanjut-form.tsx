
'use client';

import { useForm, type UseFormReturn, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { aocOptions, indonesianAircraftTypes } from '@/lib/data';
import type { TindakLanjutRecord } from '@/lib/types';
import { tindakLanjutFormSchema } from '@/lib/schemas';
import { Combobox } from '../ui/combobox';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TagInput } from '../ui/tag-input';

type TindakLanjutFormValues = z.infer<typeof tindakLanjutFormSchema>;

type TindakLanjutFormProps = {
  form: UseFormReturn<TindakLanjutFormValues>;
};

export function TindakLanjutForm({ form }: TindakLanjutFormProps) {
    
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rekomendasi',
  });
  
  const inputStyles = "bg-background/70 dark:bg-black/50 border-white/30 placeholder:text-muted-foreground/80 focus:border-primary focus:ring-primary text-foreground";

  return (
    <Form {...form}>
      <form id="tindak-lanjut-form" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <FormField
                control={form.control}
                name="judulLaporan"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Judul Laporan</FormLabel>
                    <FormControl>
                    <Input placeholder="Judul laporan KNKT..." {...field} className={inputStyles} />
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
                    <Input placeholder="Nomor laporan KNKT..." {...field} className={inputStyles} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="tanggalKejadian"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Tanggal Kejadian</FormLabel>
                    <FormControl>
                      <Input placeholder="YYYY-MM-DD" {...field} className={inputStyles} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="tanggalTerbit"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Tanggal Terbit</FormLabel>
                     <FormControl>
                      <Input placeholder="YYYY-MM-DD" {...field} className={inputStyles} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="registrasiPesawat"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Registrasi Pesawat</FormLabel>
                    <FormControl>
                    <Input placeholder="eg: PK-ABC" {...field} className={inputStyles} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="tipePesawat"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Tipe Pesawat</FormLabel>
                     <Combobox 
                        options={indonesianAircraftTypes}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Pilih atau ketik tipe pesawat..."
                        className={inputStyles}
                    />
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="lokasiKejadian"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Lokasi Kejadian</FormLabel>
                    <FormControl>
                    <Input placeholder="eg: Bandara Soekarno-Hatta" {...field} className={inputStyles} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="fileUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Embedded Link (File)</FormLabel>
                        <FormControl><Input type="url" placeholder="https://example.com/file.pdf" {...field} className={inputStyles} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="penerimaRekomendasi"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Penerima Rekomendasi</FormLabel>
                        <FormControl>
                            <TagInput
                                {...field}
                                placeholder="Enter recipients"
                                tags={field.value || []}
                                setTags={(newTags) => {
                                    form.setValue("penerimaRekomendasi", newTags, { shouldValidate: true });
                                }}
                                options={aocOptions.map(o => o.value)}
                                className={inputStyles}
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
                    <FormLabel>Status Report</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className={inputStyles}><SelectValue placeholder="Pilih status..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Final">Final</SelectItem>
                            <SelectItem value="Draft Final">Draft Final</SelectItem>
                            <SelectItem value="Preliminary">Preliminary</SelectItem>
                            <SelectItem value="Interim Statement">Interim Statement</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}/>
        </div>

        <Card className="bg-transparent border-white/30">
          <CardHeader className='flex-row items-center justify-between'>
            <CardTitle>Rekomendasi Keselamatan</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ id: `rec-${Date.now()}`, nomor: '', deskripsi: '' })}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Recommendation
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_3fr_auto] gap-4 border-t border-white/20 pt-4 first:pt-0 first:border-t-0">
                <FormField
                  control={form.control}
                  name={`rekomendasi.${index}.nomor`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 04.O-2024-02.03" {...field} className={inputStyles} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`rekomendasi.${index}.deskripsi`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Deskripsi rekomendasi..." {...field} className={inputStyles} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="mt-8 self-start"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="tindakLanjutDkppu"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Tindak Lanjut / Respon DKPPU</FormLabel>
                    <FormControl>
                    <Textarea placeholder="Gunakan 'a.' dan 'b.' untuk membuat daftar..." rows={8} {...field} className={inputStyles} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="tindakLanjutOperator"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Tindak Lanjut Operator / Pihak Terkait</FormLabel>
                    <FormControl>
                    <Textarea placeholder="Gunakan 'a.' dan 'b.' untuk membuat daftar..." rows={8} {...field} className={inputStyles} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
      </form>
    </Form>
  );
}

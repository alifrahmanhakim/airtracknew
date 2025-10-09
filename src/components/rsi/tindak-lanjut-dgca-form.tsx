

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
import { Combobox } from '../ui/combobox';
import { aocOptions, indonesianAircraftTypes } from '@/lib/data';

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
              name="operator"
              render={({ field }) => (
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
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pilih atau ketik tipe pesawat..."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="registrasi"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Registrasi</FormLabel>
                    <FormControl>
                    <Input placeholder="Registrasi pesawat..." {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="lokasi"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Lokasi</FormLabel>
                    <FormControl>
                    <Input placeholder="Lokasi kejadian..." {...field} />
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
                        <Input type="text" placeholder="YYYY-MM-DD" {...field} />
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
                        <Input type="text" placeholder="YYYY-MM-DD" {...field} />
                    </FormControl>
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

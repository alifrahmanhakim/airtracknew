
'use client';

import { useForm, type UseFormReturn } from 'react-hook-form';
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
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { TagInput } from './ui/tag-input';
import * as React from 'react';
import { addKegiatan } from '@/lib/actions/kegiatan';
import { useToast } from '@/hooks/use-toast';
import type { Kegiatan } from '@/lib/types';

const kegiatanFormSchema = z.object({
    subjek: z.string().min(1, 'Subjek is required.'),
    tanggalMulai: z.date({ required_error: 'Start date is required.'}),
    tanggalSelesai: z.date({ required_error: 'End date is required.'}),
    nama: z.array(z.string()).min(1, 'At least one name is required.'),
    lokasi: z.string().min(1, 'Lokasi is required.'),
    catatan: z.string().optional(),
}).refine((data) => data.tanggalSelesai >= data.tanggalMulai, {
    message: "End date cannot be before start date.",
    path: ["tanggalSelesai"],
});

type KegiatanFormValues = z.infer<typeof kegiatanFormSchema>;

type KegiatanFormProps = {
    onFormSubmit: (data: Kegiatan) => void;
    kegiatan?: Kegiatan;
};

export function KegiatanForm({ onFormSubmit, kegiatan }: KegiatanFormProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();

    const form = useForm<KegiatanFormValues>({
        resolver: zodResolver(kegiatanFormSchema),
        defaultValues: kegiatan ? {
            ...kegiatan,
            tanggalMulai: new Date(kegiatan.tanggalMulai),
            tanggalSelesai: new Date(kegiatan.tanggalSelesai),
        } : {
            subjek: '',
            nama: [],
            lokasi: '',
            catatan: '',
        },
    });

    const onSubmit = async (data: KegiatanFormValues) => {
        setIsLoading(true);
        const result = await addKegiatan({
            ...data,
            id: kegiatan?.id, // pass id if editing
            tanggalMulai: format(data.tanggalMulai, 'yyyy-MM-dd'),
            tanggalSelesai: format(data.tanggalSelesai, 'yyyy-MM-dd'),
        });

        setIsLoading(false);

        if (result.success && result.data) {
            onFormSubmit(result.data);
            toast({
                title: `Activity ${kegiatan ? 'Updated' : 'Added'}`,
                description: `The activity "${data.subjek}" has been saved.`,
            });
            if (!kegiatan) {
                form.reset({
                    subjek: '',
                    nama: [],
                    lokasi: '',
                    catatan: '',
                    tanggalMulai: undefined,
                    tanggalSelesai: undefined
                });
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.error || 'Failed to save the activity.',
            });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="subjek"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subjek Kegiatan</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="tanggalMulai"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Tanggal Mulai</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                    >
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
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="tanggalSelesai"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Tanggal Selesai</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                    >
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
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="nama"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama yang Terlibat</FormLabel>
                            <FormControl>
                                <TagInput
                                    {...field}
                                    placeholder="Enter names..."
                                    tags={field.value || []}
                                    setTags={(newTags) => {
                                        form.setValue("nama", newTags, { shouldValidate: true });
                                    }}
                                />
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
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="catatan"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Catatan Tambahan</FormLabel>
                            <FormControl><Textarea {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-4">
                    <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {kegiatan ? 'Save Changes' : 'Submit Kegiatan'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}

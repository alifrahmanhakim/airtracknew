
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PemeriksaanRecord } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Search, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pemeriksaanFormSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { addPemeriksaanRecord } from '@/lib/actions/pemeriksaan';

const PemeriksaanForm = dynamic(() => import('@/components/rsi/pemeriksaan-form').then(mod => mod.PemeriksaanForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const PemeriksaanTable = dynamic(() => import('@/components/rsi/pemeriksaan-table').then(mod => mod.PemeriksaanTable), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});

type PemeriksaanFormValues = z.infer<typeof pemeriksaanFormSchema>;

export default function PemeriksaanPage() {
    const [records, setRecords] = React.useState<PemeriksaanRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('records');
    const { toast } = useToast();

    // Form state
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        const q = query(collection(db, "pemeriksaanRecords"), orderBy("tanggal", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const recordsFromDb: PemeriksaanRecord[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const createdAt = data.createdAt instanceof Timestamp 
                ? data.createdAt.toDate().toISOString()
                : data.createdAt;
                recordsFromDb.push({ id: doc.id, ...data, createdAt } as PemeriksaanRecord);
            });
            setRecords(recordsFromDb);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching records: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch data from the database.',
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    const handleFormSubmitSuccess = () => {
        setActiveTab('records');
    };
    
    const form = useForm<PemeriksaanFormValues>({
        resolver: zodResolver(pemeriksaanFormSchema),
        defaultValues: {
            kategori: '',
            jenisPesawat: '',
            registrasi: '',
            tahunPembuatan: '',
            operator: '',
            lokasi: '',
            korban: '',
            ringkasanKejadian: '',
            statusPenanganan: '',
            tindakLanjut: '',
            filePemeriksaanUrl: '',
        },
    });

    const onFormSubmit = async (data: PemeriksaanFormValues) => {
        setIsSubmitting(true);
        const result = await addPemeriksaanRecord(data);
        setIsSubmitting(false);

        if (result.success) {
            toast({ title: 'Record Added', description: 'The new examination record has been successfully added.' });
            form.reset();
            handleFormSubmitSuccess();
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.error || 'Failed to add the record.',
            });
        }
    };

    return (
        <main className="p-4 md:p-8">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div className="p-4 rounded-lg bg-card/80 backdrop-blur-sm">
                        <h1 className="text-3xl font-bold">Pemeriksaan DKPPU</h1>
                        <p className="text-muted-foreground">
                            Data Kecelakaan (Accident & Serious Incident) yang Dilaksanakan Pemeriksaan oleh DKPPU.
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <TabsList>
                            <TabsTrigger value="form">Input Form</TabsTrigger>
                            <TabsTrigger value="records">Records</TabsTrigger>
                            {/* <TabsTrigger value="analytics">Analytics</TabsTrigger> */}
                        </TabsList>
                    </div>
                </div>

                <TabsContent value="form">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Examination Record</CardTitle>
                            <CardDescription>Fill out the form to add a new record.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PemeriksaanForm form={form} />
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button type="button" form="pemeriksaan-form" disabled={isSubmitting} onClick={form.handleSubmit(onFormSubmit)}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Record
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="records">
                    <Card>
                        <CardHeader>
                            <CardTitle>Examination Records</CardTitle>
                            <CardDescription>List of all examination records.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-[600px] w-full" />
                            ) : (
                                <PemeriksaanTable records={records} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* <TabsContent value="analytics">
                   Analytics content here
                </TabsContent> */}
            </Tabs>
        </main>
    );
}

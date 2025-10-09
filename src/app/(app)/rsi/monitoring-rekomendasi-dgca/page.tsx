
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { TindakLanjutDgcaRecord } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, RotateCcw, Search, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tindakLanjutDgcaFormSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { addTindakLanjutDgcaRecord, deleteTindakLanjutDgcaRecord } from '@/lib/actions/tindak-lanjut-dgca';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const TindakLanjutDgcaForm = dynamic(() => import('@/components/rsi/tindak-lanjut-dgca-form').then(mod => mod.TindakLanjutDgcaForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const TindakLanjutDgcaTable = dynamic(() => import('@/components/rsi/tindak-lanjut-dgca-table').then(mod => mod.TindakLanjutDgcaTable), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const TindakLanjutDgcaAnalytics = dynamic(() => import('@/components/rsi/tindak-lanjut-dgca-analytics').then(mod => mod.TindakLanjutDgcaAnalytics), {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" />
});

type TindakLanjutDgcaFormValues = z.infer<typeof tindakLanjutDgcaFormSchema>;

export default function MonitoringRekomendasiDgcaPage() {
    const { toast } = useToast();
    const [records, setRecords] = React.useState<TindakLanjutDgcaRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('records');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    // Filter states
    const [searchTerm, setSearchTerm] = React.useState('');

    // Delete state
    const [recordToDelete, setRecordToDelete] = React.useState<TindakLanjutDgcaRecord | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    React.useEffect(() => {
        const q = query(collection(db, 'tindakLanjutDgcaRecords'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const recordsFromDb: TindakLanjutDgcaRecord[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                recordsFromDb.push({ 
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
                } as TindakLanjutDgcaRecord);
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
    
    const form = useForm<TindakLanjutDgcaFormValues>({
        resolver: zodResolver(tindakLanjutDgcaFormSchema),
        defaultValues: {
            judulLaporan: '',
            nomorLaporan: '',
            operator: '',
            tipePesawat: '',
            registrasi: '',
            lokasi: '',
            tanggalKejadian: '',
            tanggalTerbit: '',
            rekomendasiKeDgca: '',
            nomorRekomendasi: '',
            tindakLanjutDkppu: '',
        }
    });

    const onFormSubmit = async (data: TindakLanjutDgcaFormValues) => {
        setIsSubmitting(true);
        const result = await addTindakLanjutDgcaRecord(data);
        setIsSubmitting(false);

        if (result.success) {
            toast({ title: 'Record Added', description: 'The new follow-up record has been added.' });
            form.reset();
            setActiveTab('records');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to add the record.' });
        }
    };
    
    const handleRecordUpdate = (updatedRecord: TindakLanjutDgcaRecord) => {
        setRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    };

    const handleDeleteRequest = (record: TindakLanjutDgcaRecord) => {
        setRecordToDelete(record);
    };

    const confirmDelete = async () => {
        if (!recordToDelete) return;
        setIsDeleting(true);
        const result = await deleteTindakLanjutDgcaRecord(recordToDelete.id);
        setIsDeleting(false);
        if (result.success) {
            toast({ title: 'Record Deleted', description: 'The record has been removed.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setRecordToDelete(null);
    };

    const filteredRecords = React.useMemo(() => {
        return records.filter(record => {
            const searchTermMatch = searchTerm === '' || Object.values(record).some(value => 
                typeof value === 'string' && String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );
            return searchTermMatch;
        });
    }, [records, searchTerm]);

    const resetFilters = () => {
        setSearchTerm('');
    };

    return (
        <main className="p-4 md:p-8">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="icon">
                            <Link href="/rsi">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div className="p-4 rounded-lg bg-card/80 backdrop-blur-sm">
                            <h1 className="text-3xl font-bold">Monitoring Tindak Lanjut Rekomendasi KNKT ke DGCA</h1>
                            <p className="text-muted-foreground">
                                Track and manage follow-ups on NTSC recommendations to the DGCA.
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-2'>
                        <TabsList>
                            <TabsTrigger value="form">Input Form</TabsTrigger>
                            <TabsTrigger value="records">Records</TabsTrigger>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                <TabsContent value="form">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New DGCA Follow-Up</CardTitle>
                            <CardDescription>Fill out the form to add a new record for DGCA recommendation follow-ups.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <TindakLanjutDgcaForm form={form} />
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button type="button" disabled={isSubmitting} onClick={form.handleSubmit(onFormSubmit)}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Record
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="records">
                    <Card>
                        <CardHeader>
                            <CardTitle>Records</CardTitle>
                            <CardDescription>List of all DGCA recommendation follow-ups.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {isLoading ? (
                               <Skeleton className="h-[600px] w-full" />
                           ) : (
                               <div className="space-y-4">
                                   <div className="flex flex-col sm:flex-row gap-4">
                                       <div className="relative flex-grow">
                                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                           <Input
                                               placeholder="Search records..."
                                               value={searchTerm}
                                               onChange={(e) => setSearchTerm(e.target.value)}
                                               className="pl-9"
                                           />
                                       </div>
                                       {searchTerm && (
                                           <Button variant="ghost" onClick={resetFilters}>
                                               <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                           </Button>
                                       )}
                                   </div>
                                   <TindakLanjutDgcaTable records={filteredRecords} onUpdate={handleRecordUpdate} onDelete={handleDeleteRequest} searchTerm={searchTerm} />
                               </div>
                           )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics">
                     <Card>
                        <CardHeader>
                            <CardTitle>Analytics</CardTitle>
                            <CardDescription>Visualizations of the DGCA follow-up data.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <TindakLanjutDgcaAnalytics allRecords={records} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
             <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader className="text-center items-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the record. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
}

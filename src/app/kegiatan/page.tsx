
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Kegiatan } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { deleteKegiatan } from '@/lib/actions/kegiatan';
import { Loader2, AlertTriangle, Plus, List, CalendarIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { KegiatanForm } from '@/components/kegiatan-form';
import { KegiatanTable } from '@/components/kegiatan-table';
import { eachMonthOfInterval, format, startOfYear, endOfYear, getYear, parseISO, isSameMonth, startOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

const KegiatanAnalytics = dynamic(() => import('@/components/kegiatan-analytics').then(mod => mod.KegiatanAnalytics), {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" />
});


export default function KegiatanPage() {
    const [records, setRecords] = React.useState<Kegiatan[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('records');
    const { toast } = useToast();
    
    const [recordToDelete, setRecordToDelete] = React.useState<Kegiatan | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    
    const [selectedMonth, setSelectedMonth] = React.useState<Date>(startOfMonth(new Date()));

    React.useEffect(() => {
        const q = query(collection(db, "kegiatanRecords"), orderBy("tanggalMulai", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const recordsFromDb: Kegiatan[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                recordsFromDb.push({ 
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                } as Kegiatan);
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
    
    const handleDeleteRequest = (record: Kegiatan) => {
        setRecordToDelete(record);
    };

    const handleRecordAddOrUpdate = (record: Kegiatan) => {
        setRecords(prev => {
            const existingIndex = prev.findIndex(r => r.id === record.id);
            if (existingIndex > -1) {
                const newRecords = [...prev];
                newRecords[existingIndex] = record;
                return newRecords;
            }
            return [record, ...prev];
        });
        setActiveTab('records');
    };
    
    const confirmDelete = async () => {
        if (!recordToDelete) return;

        setIsDeleting(true);
        const result = await deleteKegiatan(recordToDelete.id);
        setIsDeleting(false);

        if (result.success) {
            toast({ title: "Record Deleted", description: "The activity record has been removed." });
            setRecords(prev => prev.filter(r => r.id !== recordToDelete.id));
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setRecordToDelete(null);
    };
    
    const currentYear = getYear(new Date());
    const months = eachMonthOfInterval({
        start: startOfYear(new Date(currentYear, 0, 1)),
        end: endOfYear(new Date(currentYear, 11, 31)),
    });

    const filteredRecords = React.useMemo(() => {
        if (!selectedMonth) return records;
        return records.filter(record => 
            isSameMonth(parseISO(record.tanggalMulai), selectedMonth) ||
            isSameMonth(parseISO(record.tanggalSelesai), selectedMonth)
        );
    }, [records, selectedMonth]);


    return (
        <div className="min-h-screen bg-muted/20">
        <main className="container mx-auto p-4 md:p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <Card className="mb-4 bg-background/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex-1">
                                <CardTitle className="text-3xl font-bold flex items-center gap-2">
                                    <List />
                                    Kegiatan Subdirektorat Standardisasi
                                </CardTitle>
                                <CardDescription className="mt-2">
                                    Input, lacak, dan analisis semua kegiatan Subdirektorat Standardisasi.
                                </CardDescription>
                            </div>
                        </div>
                         <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <TabsList>
                                <TabsTrigger value="form">Input Form</TabsTrigger>
                                <TabsTrigger value="records">Jadwal Kegiatan</TabsTrigger>
                                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                            </TabsList>
                             <div className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                                <Select
                                    value={format(selectedMonth, 'yyyy-MM-dd')}
                                    onValueChange={(value) => setSelectedMonth(parseISO(value))}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Pilih Bulan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map(month => (
                                            <SelectItem key={month.toISOString()} value={format(month, 'yyyy-MM-dd')}>
                                                {format(month, 'MMMM yyyy', { locale: id })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
                
                <TabsContent value="form">
                    <Card>
                        <CardHeader>
                        <CardTitle>Form Input Kegiatan</CardTitle>
                        <CardDescription>
                            Isi formulir di bawah untuk menambahkan data kegiatan baru.
                        </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <KegiatanForm onFormSubmit={handleRecordAddOrUpdate} />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="records">
                    <KegiatanTable 
                        records={filteredRecords}
                        onDelete={handleDeleteRequest}
                        onUpdate={handleRecordAddOrUpdate}
                        isLoading={isLoading}
                    />
                </TabsContent>

                <TabsContent value="analytics">
                    <KegiatanAnalytics records={filteredRecords} />
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
                            This will permanently delete the record for: <span className="font-semibold">{recordToDelete?.subjek}</span>.
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
        </div>
    );
}


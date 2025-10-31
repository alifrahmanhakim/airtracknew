

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
import { ArrowLeft, Loader2, RotateCcw, Search, Trash2, AlertTriangle, FileSpreadsheet, Printer } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tindakLanjutDgcaFormSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { addTindakLanjutDgcaRecord, deleteTindakLanjutDgcaRecord } from '@/lib/actions/tindak-lanjut-dgca';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getYear, parseISO, format, isValid } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as XLSX from 'xlsx';
import { AppLayout } from '@/components/app-layout-component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


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
type SortDescriptor = {
  column: keyof TindakLanjutDgcaRecord;
  direction: 'asc' | 'desc';
} | null;

export default function MonitoringRekomendasiDgcaPage() {
    const { toast } = useToast();
    const [records, setRecords] = React.useState<TindakLanjutDgcaRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('records');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    // Filter and sort states
    const [searchTerm, setSearchTerm] = React.useState('');
    const [yearFilter, setYearFilter] = React.useState('all');
    const [sort, setSort] = React.useState<SortDescriptor>({ column: 'tanggalKejadian', direction: 'desc' });

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
            fileUrl: '',
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

    const yearOptions = React.useMemo(() => {
        const years = new Set(records.map(r => {
            try {
                return getYear(parseISO(r.tanggalKejadian));
            } catch (e) {
                return null;
            }
        }));
        const validYears = Array.from(years).filter(year => year !== null && !isNaN(year)) as number[];
        return ['all', ...validYears.sort((a, b) => b - a)];
    }, [records]);

    const filteredAndSortedRecords = React.useMemo(() => {
        let filtered = [...records];
        
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(record => 
                Object.values(record).some(value => 
                    typeof value === 'string' && String(value).toLowerCase().includes(lowercasedTerm)
                )
            );
        }

        if (yearFilter !== 'all') {
            filtered = filtered.filter(record => {
                 try {
                    const date = parseISO(record.tanggalKejadian);
                    if (isValid(date)) {
                         return getYear(date) === parseInt(yearFilter, 10);
                    }
                } catch (e) {
                    return false;
                }
                return false;
            });
        }

        if (sort) {
            filtered.sort((a, b) => {
                const aVal = a[sort.column];
                const bVal = b[sort.column];

                if (sort.column === 'tanggalKejadian' || sort.column === 'tanggalTerbit') {
                    const dateA = aVal && isValid(parseISO(aVal as string)) ? parseISO(aVal as string).getTime() : 0;
                    const dateB = bVal && isValid(parseISO(bVal as string)) ? parseISO(bVal as string).getTime() : 0;
                    return sort.direction === 'asc' ? dateA - dateB : dateB - dateA;
                }

                if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [records, searchTerm, yearFilter, sort]);

    const resetFilters = () => {
        setSearchTerm('');
        setYearFilter('all');
    };
    
    const handleExportExcel = () => {
        if (filteredAndSortedRecords.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Data to Export',
                description: 'There are no records matching the current filters.',
            });
            return;
        }

        const dataToExport = filteredAndSortedRecords.map(record => ({
            'Judul Laporan': record.judulLaporan,
            'Nomor Laporan': record.nomorLaporan,
            'Operator': record.operator,
            'Tipe Pesawat': record.tipePesawat,
            'Registrasi': record.registrasi,
            'Lokasi': record.lokasi,
            'Tanggal Kejadian': record.tanggalKejadian && isValid(parseISO(record.tanggalKejadian)) ? format(parseISO(record.tanggalKejadian), 'yyyy-MM-dd') : '',
            'Tanggal Terbit': record.tanggalTerbit && isValid(parseISO(record.tanggalTerbit)) ? format(parseISO(record.tanggalTerbit), 'yyyy-MM-dd') : '',
            'Rekomendasi ke DGCA': record.rekomendasiKeDgca,
            'Nomor Rekomendasi': record.nomorRekomendasi,
            'Tindak Lanjut DKPPU': record.tindakLanjutDkppu,
            'File URL': record.fileUrl,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Tindak Lanjut DGCA');
        XLSX.writeFile(workbook, 'tindak_lanjut_dgca.xlsx');
    };
    
    const handleExportPdf = () => {
        if (filteredAndSortedRecords.length === 0) {
            toast({ variant: "destructive", title: "No Data", description: "There is no data to generate a PDF for." });
            return;
        }
        const doc = new jsPDF({ orientation: 'landscape' });
        const logoUrl = 'https://ik.imagekit.io/avmxsiusm/LOGO-AIRTRACK%20black.png';

        const addPageContent = (pageNumber: number, pageCount: number) => {
            doc.setFontSize(18);
            doc.text("Tindak Lanjut Rekomendasi KNKT ke DGCA", 14, 15);

            if(pageNumber === 1) {
              doc.addImage(logoUrl, 'PNG', doc.internal.pageSize.getWidth() - 45, 8, 30, 10);
            }
            
            doc.setFontSize(8);
            const copyrightText = `Copyright © AirTrack ${new Date().getFullYear()}`;
            const textWidth = doc.getStringUnitWidth(copyrightText) * doc.getFontSize() / doc.internal.scaleFactor;
            const textX = doc.internal.pageSize.width - textWidth - 14;
            doc.text(copyrightText, textX, doc.internal.pageSize.height - 10);

            const pageText = `Page ${pageNumber} of ${pageCount}`;
            doc.text(pageText, 14, doc.internal.pageSize.height - 10);
        };

        const tableColumn = ["Laporan KNKT", "Rekomendasi", "Nomor Rekomendasi", "Tindak Lanjut DKPPU"];
        const tableRows = filteredAndSortedRecords.map(record => [
            `${record.judulLaporan}\nNo: ${record.nomorLaporan}\nOp: ${record.operator}\nReg: ${record.registrasi}\nKejadian: ${record.tanggalKejadian}`,
            record.rekomendasiKeDgca,
            record.nomorRekomendasi,
            record.tindakLanjutDkppu
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
            didDrawPage: (data) => {
                addPageContent(data.pageNumber, (doc as any).internal.getNumberOfPages());
            }
        });
        
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageText = `Page ${i} of ${pageCount}`;
            doc.setFontSize(8);
            doc.text(pageText, 14, doc.internal.pageSize.height - 10);
        }

        doc.save("tindak_lanjut_dgca.pdf");
    };


    return (
        <AppLayout>
            <main className="p-4 md:p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <Card className="mb-4">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <Button asChild variant="outline" size="icon" className="transition-all hover:-translate-x-1">
                                        <Link href="/rsi">
                                            <ArrowLeft className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <div>
                                        <h1 className="text-3xl font-bold">Monitoring Tindak Lanjut Rekomendasi KNKT ke DGCA</h1>
                                        <p className="text-muted-foreground mt-2">
                                            Track and manage follow-ups on NTSC recommendations to the DGCA.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <TabsList>
                                <TabsTrigger value="form">Input Form</TabsTrigger>
                                <TabsTrigger value="records">Records</TabsTrigger>
                                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                            </TabsList>
                        </CardContent>
                    </Card>

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
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>Records</CardTitle>
                                        <CardDescription>List of all DGCA recommendation follow-ups.</CardDescription>
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <Button variant="outline" onClick={handleExportExcel}>
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                            Export to Excel
                                        </Button>
                                        <Button variant="outline" onClick={handleExportPdf}>
                                            <Printer className="mr-2 h-4 w-4" />
                                            Export to PDF
                                        </Button>
                                    </div>
                                </div>
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
                                            <Select value={yearFilter} onValueChange={setYearFilter}>
                                                <SelectTrigger className="w-full sm:w-[180px]">
                                                    <SelectValue placeholder="Filter by year..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {yearOptions.map(year => (
                                                        <SelectItem key={String(year)} value={String(year)}>
                                                            {year === 'all' ? 'All Years' : year}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        {(searchTerm || yearFilter !== 'all') && (
                                            <Button variant="ghost" onClick={resetFilters}>
                                                <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                            </Button>
                                        )}
                                    </div>
                                    <TindakLanjutDgcaTable 
                                            records={filteredAndSortedRecords} 
                                            onUpdate={handleRecordUpdate} 
                                            onDelete={handleDeleteRequest} 
                                            searchTerm={searchTerm}
                                            sort={sort}
                                            setSort={setSort}
                                        />
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
                            <TindakLanjutDgcaAnalytics allRecords={filteredAndSortedRecords} />
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
        </AppLayout>
    );
}

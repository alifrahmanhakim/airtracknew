
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { TindakLanjutRecord } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, RotateCcw, Search, Trash2, AlertTriangle, FileSpreadsheet, Printer } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tindakLanjutFormSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { addTindakLanjutRecord, deleteTindakLanjutRecord } from '@/lib/actions/tindak-lanjut';
import { getYear, format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { aocOptions } from '@/lib/data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AppLayout } from '@/components/app-layout-component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';


const TindakLanjutForm = dynamic(() => import('@/components/rsi/tindak-lanjut-form').then(mod => mod.TindakLanjutForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const TindakLanjutTable = dynamic(() => import('@/components/rsi/tindak-lanjut-table').then(mod => mod.TindakLanjutTable), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const TindakLanjutAnalytics = dynamic(() => import('@/components/rsi/tindak-lanjut-analytics').then(mod => mod.TindakLanjutAnalytics), {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" />
});

type TindakLanjutFormValues = z.infer<typeof tindakLanjutFormSchema>;

export default function MonitoringRekomendasiPage() {
    const { toast } = useToast();
    const [records, setRecords] = React.useState<TindakLanjutRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('records');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    // Filter states
    const [searchTerm, setSearchTerm] = React.useState('');
    const [penerimaFilter, setPenerimaFilter] = React.useState('all');
    const [yearFilter, setYearFilter] = React.useState('all');

    // Delete state
    const [recordToDelete, setRecordToDelete] = React.useState<TindakLanjutRecord | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    React.useEffect(() => {
        const q = query(collection(db, 'tindakLanjutRecords'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const recordsFromDb: TindakLanjutRecord[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                recordsFromDb.push({ 
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
                } as TindakLanjutRecord);
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
    
    const form = useForm<TindakLanjutFormValues>({
        resolver: zodResolver(tindakLanjutFormSchema),
        defaultValues: {
            judulLaporan: '',
            nomorLaporan: '',
            tanggalKejadian: '',
            penerimaRekomendasi: [],
            rekomendasi: [{ id: 'rec-1', nomor: '', deskripsi: '' }],
            tindakLanjutDkppu: '',
            tindakLanjutOperator: '',
            status: 'Draft',
            registrasiPesawat: '',
            tipePesawat: '',
            lokasiKejadian: '',
            fileUrl: '',
        }
    });

    const onFormSubmit = async (data: TindakLanjutFormValues) => {
        setIsSubmitting(true);
        const result = await addTindakLanjutRecord(data);
        setIsSubmitting(false);

        if (result.success) {
            toast({ title: 'Record Added', description: 'The new follow-up record has been added.' });
            form.reset();
            setActiveTab('records');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to add the record.' });
        }
    };
    
    const handleRecordUpdate = (updatedRecord: TindakLanjutRecord) => {
        setRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    };

    const handleDeleteRequest = (record: TindakLanjutRecord) => {
        setRecordToDelete(record);
    };

    const confirmDelete = async () => {
        if (!recordToDelete) return;
        setIsDeleting(true);
        const result = await deleteTindakLanjutRecord(recordToDelete.id);
        setIsDeleting(false);
        if (result.success) {
            toast({ title: 'Record Deleted', description: 'The record has been removed.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setRecordToDelete(null);
    };

    const yearOptions = React.useMemo(() => ['all', ...[...new Set(records.map(r => r.tahun))].sort((a,b) => b - a)], [records]);
    const penerimaOptions = React.useMemo(() => {
        const allPenerima = new Set(records.flatMap(r => r.penerimaRekomendasi || []));
        return ['all', ...Array.from(allPenerima).sort()];
    }, [records]);


    const filteredRecords = React.useMemo(() => {
        return records.filter(record => {
            const searchTermMatch = searchTerm === '' || Object.values(record).some(value => {
                if (typeof value === 'string') {
                    return String(value).toLowerCase().includes(searchTerm.toLowerCase())
                }
                if (Array.isArray(value)) {
                    return value.some(item => 
                        (typeof item === 'string' && item.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (typeof item === 'object' && item !== null && Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase())))
                    );
                }
                return false;
            });
            
            const penerimaMatch = penerimaFilter === 'all' || (record.penerimaRekomendasi && record.penerimaRekomendasi.includes(penerimaFilter));
            const yearMatch = yearFilter === 'all' || record.tahun === parseInt(yearFilter, 10);
            
            return searchTermMatch && penerimaMatch && yearMatch;
        });
    }, [records, searchTerm, penerimaFilter, yearFilter]);

    const resetFilters = () => {
        setSearchTerm('');
        setPenerimaFilter('all');
        setYearFilter('all');
    };
    
    const handleExportExcel = () => {
        if (filteredRecords.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Data to Export',
                description: 'There are no records matching the current filters.',
            });
            return;
        }

        const dataToExport = filteredRecords.flatMap(record => {
            const penerimaText = Array.isArray(record.penerimaRekomendasi) ? record.penerimaRekomendasi.join(', ') : '';
            if (record.rekomendasi && record.rekomendasi.length > 0) {
                return record.rekomendasi.map(rec => ({
                    'Judul Laporan': record.judulLaporan,
                    'Nomor Laporan': record.nomorLaporan,
                    'Tanggal Kejadian': record.tanggalKejadian,
                    'Tanggal Terbit': record.tanggalTerbit || '',
                    'Penerima Rekomendasi': penerimaText,
                    'Nomor Rekomendasi': rec.nomor,
                    'Deskripsi Rekomendasi': rec.deskripsi,
                    'Tindak Lanjut DKPPU': record.tindakLanjutDkppu,
                    'Tindak Lanjut Operator': record.tindakLanjutOperator,
                    'Status': record.status,
                }));
            }
            // If no recommendations, export the main record info once
            return [{
                'Judul Laporan': record.judulLaporan,
                'Nomor Laporan': record.nomorLaporan,
                'Tanggal Kejadian': record.tanggalKejadian,
                'Tanggal Terbit': record.tanggalTerbit || '',
                'Penerima Rekomendasi': penerimaText,
                'Nomor Rekomendasi': '',
                'Deskripsi Rekomendasi': '',
                'Tindak Lanjut DKPPU': record.tindakLanjutDkppu,
                'Tindak Lanjut Operator': record.tindakLanjutOperator,
                'Status': record.status,
            }];
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Tindak Lanjut KNKT');
        XLSX.writeFile(workbook, 'tindak_lanjut_knkt.xlsx');
    };
    
    const handleExportPdf = () => {
        if (filteredRecords.length === 0) {
            toast({ variant: "destructive", title: "No Data", description: "There is no data to generate a PDF for." });
            return;
        }

        const logoUrl = 'https://ik.imagekit.io/avmxsiusm/LOGO-AIRTRACK%20black.png';
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = logoUrl;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                toast({ variant: "destructive", title: "Canvas Error", description: "Could not create canvas context for PDF logo." });
                return;
            }
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');

            generatePdf(dataUrl);
        };

        img.onerror = () => {
            toast({ variant: "destructive", title: "Logo Error", description: "Could not load logo for PDF. Exporting without it." });
            generatePdf(); // Proceed without the logo if it fails
        };
        
        const generatePdf = (logoDataUrl?: string) => {
            const doc = new jsPDF({ orientation: 'landscape' });

            const addPageContent = (data: { pageNumber: number }) => {
                if (logoDataUrl && data.pageNumber === 1) {
                    const aspectRatio = img.width / img.height;
                    const logoWidth = 30;
                    const logoHeight = aspectRatio > 0 ? logoWidth / aspectRatio : 0;
                    if (logoHeight > 0) {
                        doc.addImage(logoDataUrl, 'PNG', doc.internal.pageSize.getWidth() - (logoWidth + 15), 8, logoWidth, logoHeight);
                    }
                }

                doc.setFontSize(18);
                doc.text("Monitoring Tindak Lanjut Rekomendasi KNKT", 14, 15);
                
                doc.setFontSize(8);
                const copyrightText = `Copyright © AirTrack ${new Date().getFullYear()}`;
                const textWidth = doc.getStringUnitWidth(copyrightText) * doc.getFontSize() / doc.internal.scaleFactor;
                const textX = doc.internal.pageSize.width - textWidth - 14;
                doc.text(copyrightText, textX, doc.internal.pageSize.height - 10);

                const pageText = `Page ${data.pageNumber} of ${(doc as any).internal.getNumberOfPages()}`;
                doc.text(pageText, 14, doc.internal.pageSize.height - 10);
            };

            const tableColumn = ["Laporan KNKT", "Penerima", "Rekomendasi", "Tindak Lanjut DKPPU", "Tindak Lanjut Operator", "Status"];
            const tableRows = filteredRecords.map(record => {
                const rekomendasiText = (record.rekomendasi || []).map(r => `${r.nomor}: ${r.deskripsi}`).join('\n\n');
                const penerimaText = (Array.isArray(record.penerimaRekomendasi) ? record.penerimaRekomendasi : [record.penerimaRekomendasi]).join('\n');
                return [
                    `${record.judulLaporan}\nNo: ${record.nomorLaporan}`,
                    penerimaText,
                    rekomendasiText,
                    record.tindakLanjutDkppu || '-',
                    record.tindakLanjutOperator || '-',
                    record.status,
                ];
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 25,
                theme: 'grid',
                headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
                didDrawPage: addPageContent,
            });

            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 2; i <= pageCount; i++) {
                doc.setPage(i);
                addPageContent({ pageNumber: i });
            }

            doc.save("tindak_lanjut_knkt.pdf");
        };
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
                                        <h1 className="text-3xl font-bold">Monitoring Tindak Lanjut Rekomendasi KNKT</h1>
                                        <p className="text-muted-foreground mt-2">
                                            Track and manage follow-ups on NTSC safety recommendations.
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
                                <CardTitle>Add New Recommendation Follow-Up</CardTitle>
                                <CardDescription>Fill out the form to add a new record.</CardDescription>
                            </CardHeader>
                            <CardContent>
                            <TindakLanjutForm form={form} />
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
                                        <CardDescription>List of all recommendation follow-ups.</CardDescription>
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
                                        <Select value={penerimaFilter} onValueChange={setPenerimaFilter}>
                                            <SelectTrigger className="w-full sm:w-[250px]"><SelectValue placeholder="Filter by Penerima..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Penerima</SelectItem>
                                                    {penerimaOptions.map((op, i) => <SelectItem key={`${op}-${i}`} value={op}>{op}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Select value={String(yearFilter)} onValueChange={setYearFilter}>
                                            <SelectTrigger className="w-full sm:w-[120px]"><SelectValue placeholder="Filter by year..." /></SelectTrigger>
                                            <SelectContent>
                                                {yearOptions.map(year => <SelectItem key={year} value={String(year)}>{year === 'all' ? 'All Years' : year}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {(searchTerm || penerimaFilter !== 'all' || yearFilter !== 'all') && (
                                            <Button variant="ghost" onClick={resetFilters}>
                                                <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                            </Button>
                                        )}
                                    </div>
                                    <TindakLanjutTable records={filteredRecords} onUpdate={handleRecordUpdate} onDelete={handleDeleteRequest} searchTerm={searchTerm} />
                                </div>
                            )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="analytics">
                        <Card>
                            <CardHeader>
                                <CardTitle>Analytics</CardTitle>
                                <CardDescription>Visualizations of the follow-up data.</CardDescription>
                            </CardHeader>
                            <CardContent>
                            <TindakLanjutAnalytics allRecords={filteredRecords} />
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

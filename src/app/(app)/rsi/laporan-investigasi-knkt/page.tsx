

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { KnktReport } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Search, ArrowLeft, Loader2, AlertTriangle, Trash2, FileSpreadsheet, Printer, ChevronDown } from 'lucide-react';
import { getYear, parseISO } from 'date-fns';
import { aocOptions, taxonomyOptions as staticTaxonomyOptions } from '@/lib/data';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { knktReportFormSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { addKnktReport, deleteKnktReport } from '@/lib/actions/knkt';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import * as XLSX from 'xlsx';
import { AppLayout } from '@/components/app-layout-component';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const KnktReportsTable = dynamic(() => import('@/components/rsi/knkt-reports-table').then(mod => mod.KnktReportsTable), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const KnktReportForm = dynamic(() => import('@/components/rsi/knkt-report-form').then(mod => mod.KnktReportForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" />
});
const KnktAnalytics = dynamic(() => import('@/components/rsi/knkt-analytics').then(mod => mod.KnktAnalytics), {
    loading: () => <Skeleton className="h-[600px] w-full" />
});

type KnktReportFormValues = z.infer<typeof knktReportFormSchema>;

export default function LaporanInvestigasiKnktPage() {
    const [records, setRecords] = React.useState<KnktReport[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();
    const [activeTab, setActiveTab] = React.useState('records');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = React.useState('');
    const [operatorFilter, setOperatorFilter] = React.useState('all');
    const [yearFilter, setYearFilter] = React.useState('all');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [taxonomyFilter, setTaxonomyFilter] = React.useState('all');

    // Delete state
    const [recordToDelete, setRecordToDelete] = React.useState<KnktReport | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    React.useEffect(() => {
        const q = query(collection(db, "knktReports"), orderBy("tanggal_diterbitkan", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const recordsFromDb: KnktReport[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                recordsFromDb.push({ id: doc.id, ...data } as KnktReport);
            });
            setRecords(recordsFromDb);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching KNKT reports: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch data from the database.',
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);
    
    const yearOptions = React.useMemo(() => {
        const years = [...new Set(records.map(r => getYear(parseISO(r.tanggal_diterbitkan))))];
        return ['all', ...years.sort((a, b) => b - a)];
    }, [records]);
    
    const statusOptions = React.useMemo(() => ['all', ...[...new Set(records.map(r => r.status))].sort()], [records]);
    const operatorOptions = React.useMemo(() => ['all', ...[...new Set(records.map(r => r.operator))].sort()], [records]);
    const taxonomyOptions = React.useMemo(() => {
        const dynamicTaxonomies = [...new Set(records.map(r => r.taxonomy).filter(Boolean))];
        const staticTaxonomyValues = staticTaxonomyOptions.map(t => t.value);
        const combined = [...new Set([...staticTaxonomyValues, ...dynamicTaxonomies])];
        return ['all', ...combined.sort()];
    }, [records]);


    const filteredRecords = React.useMemo(() => {
        return records.filter(record => {
            const searchTermMatch = searchTerm === '' || Object.values(record).some(value => 
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );
            const operatorMatch = operatorFilter === 'all' || record.operator === operatorFilter;
            const yearMatch = yearFilter === 'all' || getYear(parseISO(record.tanggal_diterbitkan)) === parseInt(yearFilter);
            const statusMatch = statusFilter === 'all' || record.status === statusFilter;
            const taxonomyMatch = taxonomyFilter === 'all' || record.taxonomy === taxonomyFilter;

            return searchTermMatch && operatorMatch && yearMatch && statusMatch && taxonomyMatch;
        });
    }, [records, searchTerm, operatorFilter, yearFilter, statusFilter, taxonomyFilter]);

    const resetFilters = () => {
        setSearchTerm('');
        setOperatorFilter('all');
        setYearFilter('all');
        setStatusFilter('all');
        setTaxonomyFilter('all');
    };
    
    const form = useForm<KnktReportFormValues>({
        resolver: zodResolver(knktReportFormSchema),
        defaultValues: {
            status: 'Final',
            operator: '',
            registrasi: '',
            tipe_pesawat: '',
            lokasi: '',
            taxonomy: '',
            keterangan: '',
            nomor_laporan: '',
            fileUrl: '',
        },
    });

    const onFormSubmit = async (data: KnktReportFormValues) => {
        setIsSubmitting(true);
        const result = await addKnktReport(data);
        setIsSubmitting(false);

        if (result.success) {
            toast({ title: 'Record Added', description: 'The new KNKT report has been successfully added.' });
            form.reset();
            setActiveTab('records');
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.error || 'Failed to add the record.',
            });
        }
    };
    
    const handleRecordUpdate = (updatedRecord: KnktReport) => {
        setRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    };

    const handleDeleteRequest = (record: KnktReport) => {
        setRecordToDelete(record);
    };

    const confirmDelete = async () => {
        if (!recordToDelete) return;

        setIsDeleting(true);
        const result = await deleteKnktReport(recordToDelete.id);
        setIsDeleting(false);

        if (result.success) {
            toast({ title: "Record Deleted", description: "The KNKT Report has been removed." });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setRecordToDelete(null);
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

        const dataToExport = filteredRecords.map(record => ({
            'Tanggal Diterbitkan': record.tanggal_diterbitkan,
            'Nomor Laporan': record.nomor_laporan,
            'Status': record.status,
            'Operator': record.operator,
            'Registrasi': record.registrasi,
            'Tipe Pesawat': record.tipe_pesawat,
            'Lokasi': record.lokasi,
            'Taxonomy': record.taxonomy,
            'Keterangan': record.keterangan,
            'File URL': record.fileUrl,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'KNKT Reports');
        XLSX.writeFile(workbook, 'knkt_reports.xlsx');
    };
    
    const handleExportPdf = () => {
        if (filteredRecords.length === 0) {
            toast({ variant: "destructive", title: "No Data", description: "There is no data to generate a PDF for." });
            return;
        }
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(18);
        doc.text("KNKT Investigation Reports", 14, 20);

        const tableColumn = ["Tanggal Terbit", "No. Laporan", "Status", "Operator", "Registrasi", "Tipe Pesawat", "Lokasi", "Taxonomy"];
        const tableRows = filteredRecords.map(record => [
            record.tanggal_diterbitkan,
            record.nomor_laporan,
            record.status,
            record.operator,
            record.registrasi,
            record.tipe_pesawat,
            record.lokasi,
            record.taxonomy || 'N/A'
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
            didDrawPage: (data) => {
                doc.setFontSize(8);
                const text = `Copyright © AirTrack ${new Date().getFullYear()}`;
                const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
                const textX = (doc.internal.pageSize.width - textWidth) / 2;
                doc.text(text, textX, doc.internal.pageSize.height - 10);
            }
        });

        doc.save("knkt_reports.pdf");
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
                                        <h1 className="text-3xl font-bold">Laporan Investigasi dan Rekomendasi KNKT</h1>
                                        <p className="text-muted-foreground mt-2">
                                            Manage and view NTSC investigation reports.
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
                                <CardTitle>Add New KNKT Report</CardTitle>
                                <CardDescription>Fill out the form to add a new report.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <KnktReportForm form={form} />
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
                                        <CardTitle>Investigation Reports</CardTitle>
                                        <CardDescription>
                                            Daftar semua laporan investigasi yang diterbitkan oleh KNKT.
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            Export <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleExportExcel}>
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                            Export to Excel
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleExportPdf}>
                                            <Printer className="mr-2 h-4 w-4" />
                                            Export to PDF
                                        </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <Skeleton className="h-[600px] w-full" />
                                ) : (
                                    <>
                                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                        <div className="relative flex-grow">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search all fields..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>
                                        <Select value={operatorFilter} onValueChange={setOperatorFilter}>
                                            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filter by Operator..." /></SelectTrigger>
                                            <SelectContent>{operatorOptions.map(op => <SelectItem key={op} value={op}>{op === 'all' ? 'All Operators' : op}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Select value={taxonomyFilter} onValueChange={setTaxonomyFilter}>
                                            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filter by Taxonomy..." /></SelectTrigger>
                                            <SelectContent>{taxonomyOptions.map(tax => <SelectItem key={tax} value={tax}>{tax === 'all' ? 'All Taxonomies' : tax}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                                            <SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Select value={String(yearFilter)} onValueChange={setYearFilter}>
                                            <SelectTrigger className="w-full sm:w-[120px]"><SelectValue placeholder="Filter by year..." /></SelectTrigger>
                                            <SelectContent>{yearOptions.map(year => <SelectItem key={year} value={String(year)}>{year === 'all' ? 'All Years' : year}</SelectItem>)}</SelectContent>
                                        </Select>
                                        {(searchTerm || operatorFilter !== 'all' || yearFilter !== 'all' || statusFilter !== 'all' || taxonomyFilter !== 'all') && (
                                            <Button variant="ghost" onClick={resetFilters}>
                                                <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                            </Button>
                                        )}
                                    </div>
                                    <KnktReportsTable records={filteredRecords} onUpdate={handleRecordUpdate} onDelete={handleDeleteRequest} searchTerm={searchTerm} />
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="analytics">
                        <KnktAnalytics allRecords={filteredRecords} />
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
                                This action cannot be undone. This will permanently delete the report: <span className="font-semibold">{recordToDelete?.nomor_laporan}</span>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </AppLayout>
    );
}

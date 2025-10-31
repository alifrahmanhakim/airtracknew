

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AccidentIncidentRecord } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Search, Loader2, ArrowLeft, FileSpreadsheet, Printer } from 'lucide-react';
import { getYear, parseISO, format, isValid } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accidentIncidentFormSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { addAccidentIncidentRecord } from '@/lib/actions/accident-incident';
import { aocOptions } from '@/lib/data';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { EditAccidentIncidentRecordDialog } from '@/components/rsi/edit-accident-incident-dialog';
import { AppLayout } from '@/components/app-layout-component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AccidentIncidentForm = dynamic(() => import('@/components/rsi/accident-incident-form').then(mod => mod.AccidentIncidentForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const AccidentIncidentTable = dynamic(() => import('@/components/rsi/accident-incident-table').then(mod => mod.AccidentIncidentTable), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const AccidentIncidentAnalytics = dynamic(() => import('@/components/rsi/accident-incident-analytics').then(mod => mod.AccidentIncidentAnalytics), {
    loading: () => <Skeleton className="h-[800px] w-full" />
});

type AccidentIncidentFormValues = z.infer<typeof accidentIncidentFormSchema>;

export default function DataAccidentIncidentPage() {
    const [records, setRecords] = React.useState<AccidentIncidentRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('records');
    const { toast } = useToast();
    const [recordToEdit, setRecordToEdit] = React.useState<AccidentIncidentRecord | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = React.useState('');
    const [aocFilter, setAocFilter] = React.useState('all');
    const [yearFilter, setYearFilter] = React.useState('all');
    const [categoryFilter, setCategoryFilter] = React.useState('all');
    
    // Form state
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        const q = query(collection(db, "accidentIncidentRecords"), orderBy("tanggal", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const recordsFromDb: AccidentIncidentRecord[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const createdAt = data.createdAt instanceof Timestamp 
                ? data.createdAt.toDate().toISOString()
                : data.createdAt;
                recordsFromDb.push({ id: doc.id, ...data, createdAt } as AccidentIncidentRecord);
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
    
    const yearOptions = React.useMemo(() => {
        if (records.length === 0) return ['all'];
        const years = new Set<number>();
        records.forEach(r => {
            try {
                if (r.tanggal && isValid(parseISO(r.tanggal))) {
                    years.add(getYear(parseISO(r.tanggal)));
                }
            } catch (e) {
                // Ignore invalid date formats
            }
        });
        const validYears = Array.from(years).filter(year => !isNaN(year));
        return ['all', ...validYears.sort((a, b) => b - a)];
    }, [records]);
    
    const categoryOptions = React.useMemo(() => ['all', ...[...new Set(records.map(r => r.kategori))].sort()], [records]);

    const filteredRecords = React.useMemo(() => {
        return records.filter(record => {
            const searchTermMatch = searchTerm === '' || Object.values(record).some(value => 
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );
            const aocMatch = aocFilter === 'all' || record.aoc === aocFilter;
            const yearMatch = yearFilter === 'all' || (record.tanggal && isValid(parseISO(record.tanggal)) && getYear(parseISO(record.tanggal)) === parseInt(yearFilter));
            const categoryMatch = categoryFilter === 'all' || record.kategori === categoryFilter;

            return searchTermMatch && aocMatch && yearMatch && categoryMatch;
        });
    }, [records, searchTerm, aocFilter, yearFilter, categoryFilter]);

    const handleFormSubmitSuccess = () => {
        setActiveTab('records');
    };
    
    const handleRecordUpdate = (updatedRecord: AccidentIncidentRecord) => {
        setRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
        setRecordToEdit(null);
    };

    const resetTableFilters = () => {
        setSearchTerm('');
        setAocFilter('all');
        setCategoryFilter('all');
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

        const dataToExport = filteredRecords.map(record => ({
            Tanggal: record.tanggal,
            Kategori: record.kategori,
            AOC: record.aoc,
            'Registrasi Pesawat': record.registrasiPesawat,
            'Tipe Pesawat': record.tipePesawat,
            Lokasi: record.lokasi,
            Taxonomy: record.taxonomy,
            'Keterangan Kejadian': record.keteranganKejadian,
            'Korban Jiwa': record.korbanJiwa,
            'File URL': record.fileUrl,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Accident & Incident Records');
        XLSX.writeFile(workbook, 'accident_incident_records.xlsx');
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
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            
            const doc = new jsPDF({ orientation: 'landscape' });

            const addPageContent = (data: { pageNumber: number }) => {
                if (data.pageNumber === 1) {
                    const aspectRatio = img.width / img.height;
                    const logoWidth = 30;
                    const logoHeight = logoWidth / aspectRatio;
                    doc.addImage(dataUrl, 'PNG', doc.internal.pageSize.getWidth() - 45, 8, logoWidth, logoHeight);
                }
        
                doc.setFontSize(18);
                doc.text("Accident & Serious Incident Records", 14, 15);
                
                doc.setFontSize(8);
                const copyrightText = `Copyright © AirTrack ${new Date().getFullYear()}`;
                const textWidth = doc.getStringUnitWidth(copyrightText) * doc.getFontSize() / doc.internal.scaleFactor;
                const textX = doc.internal.pageSize.width - textWidth - 14;
                doc.text(copyrightText, textX, doc.internal.pageSize.height - 10);

                const pageText = `Page ${data.pageNumber} of ${(doc as any).internal.getNumberOfPages()}`;
                doc.text(pageText, 14, doc.internal.pageSize.height - 10);
            };

            const tableColumn = ["Tanggal", "Kategori", "AOC", "Registrasi", "Tipe Pesawat", "Lokasi", "Taxonomy"];
            const tableRows = filteredRecords.map(record => [
                record.tanggal,
                record.kategori,
                record.aoc,
                record.registrasiPesawat,
                record.tipePesawat,
                record.lokasi,
                record.taxonomy
            ]);

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

            doc.save("accident_incident_records.pdf");
        };

        img.onerror = () => {
            toast({ variant: "destructive", title: "Logo Error", description: "Could not load the logo image. PDF will be generated without it." });
            // Fallback to generate PDF without logo
            const doc = new jsPDF({ orientation: 'landscape' });
            autoTable(doc, {
                head: [["Tanggal", "Kategori", "AOC", "Registrasi", "Tipe Pesawat", "Lokasi", "Taxonomy"]],
                body: filteredRecords.map(record => [record.tanggal, record.kategori, record.aoc, record.registrasiPesawat, record.tipePesawat, record.lokasi, record.taxonomy])
            });
            doc.save("accident_incident_records.pdf");
        }
    };


    const form = useForm<AccidentIncidentFormValues>({
        resolver: zodResolver(accidentIncidentFormSchema),
        defaultValues: {
            tanggal: format(new Date(), 'yyyy-MM-dd'),
            kategori: 'Accident (A)',
            aoc: '',
            registrasiPesawat: '',
            tipePesawat: '',
            lokasi: '',
            taxonomy: '',
            keteranganKejadian: '',
            adaKorbanJiwa: 'Tidak Ada',
            jumlahKorbanJiwa: '',
            fileUrl: '',
        },
    });

    const onFormSubmit = async (data: AccidentIncidentFormValues) => {
        setIsSubmitting(true);
        const result = await addAccidentIncidentRecord(data);
        setIsSubmitting(false);

        if (result.success) {
            toast({ title: 'Record Added', description: 'The new record has been successfully added.' });
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
                                        <h1 className="text-3xl font-bold">Data Accident &amp; Serious Incident</h1>
                                        <p className="text-muted-foreground mt-2">
                                            Manage and view accident and serious incident records.
                                        </p>
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto">
                                    <Select value={String(yearFilter)} onValueChange={setYearFilter}>
                                        <SelectTrigger className="w-full sm:w-[180px]">
                                            <SelectValue placeholder="Filter by year..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {yearOptions.map(year => (
                                                <SelectItem key={String(year)} value={String(year)}>{year === 'all' ? 'All Years' : String(year)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="mt-4">
                                <TabsList>
                                    <TabsTrigger value="form" className="flex-1">Input Form</TabsTrigger>
                                    <TabsTrigger value="records" className="flex-1">Records</TabsTrigger>
                                    <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
                                </TabsList>
                            </div>
                        </CardHeader>
                    </Card>

                    <TabsContent value="form">
                        <Card>
                            <CardHeader>
                                <CardTitle>Add New Record</CardTitle>
                                <CardDescription>Fill out the form to add a new accident or serious incident record.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AccidentIncidentForm form={form} />
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button type="button" form="accident-incident-form" disabled={isSubmitting} onClick={form.handleSubmit(onFormSubmit)}>
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
                                        <CardDescription>List of all accident and serious incident records.</CardDescription>
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
                                        <Select value={aocFilter} onValueChange={setAocFilter}>
                                            <SelectTrigger className="w-full sm:w-[200px]">
                                                <SelectValue placeholder="Filter by AOC..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All AOCs</SelectItem>
                                                {aocOptions.map(op => (
                                                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                            <SelectTrigger className="w-full sm:w-[200px]">
                                                <SelectValue placeholder="Filter by Category..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categoryOptions.map(cat => (
                                                    <SelectItem key={String(cat)} value={String(cat)}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {(searchTerm || aocFilter !== 'all' || categoryFilter !== 'all') && (
                                            <Button variant="ghost" onClick={resetTableFilters}>
                                                <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                            </Button>
                                        )}
                                    </div>
                                    <AccidentIncidentTable records={filteredRecords} onEdit={setRecordToEdit} searchTerm={searchTerm} />
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="analytics">
                        {isLoading ? (
                            <Skeleton className="h-[800px] w-full" />
                        ) : (
                            <AccidentIncidentAnalytics allRecords={filteredRecords} />
                        )}
                    </TabsContent>
                </Tabs>
                {recordToEdit && (
                    <EditAccidentIncidentRecordDialog
                        record={recordToEdit}
                        onRecordUpdate={handleRecordUpdate}
                        open={!!recordToEdit}
                        onOpenChange={(isOpen) => !isOpen && setRecordToEdit(null)}
                    />
                )}
            </main>
        </AppLayout>
    );
}

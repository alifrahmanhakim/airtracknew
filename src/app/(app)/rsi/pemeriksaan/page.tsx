

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
import { Button } from '@/components/ui/button';
import { Loader2, Search, RotateCcw, ArrowLeft, FileSpreadsheet, Printer } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pemeriksaanFormSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { addPemeriksaanRecord } from '@/lib/actions/pemeriksaan';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getYear, parseISO } from 'date-fns';
import Link from 'next/link';
import { aocOptions } from '@/lib/data';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import * as XLSX from 'xlsx';
import { AppLayout } from '@/components/app-layout-component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PemeriksaanForm = dynamic(() => import('@/components/rsi/pemeriksaan-form').then(mod => mod.PemeriksaanForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const PemeriksaanTable = dynamic(() => import('@/components/rsi/pemeriksaan-table').then(mod => mod.PemeriksaanTable), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const PemeriksaanAnalytics = dynamic(() => import('@/components/rsi/pemeriksaan-analytics').then(mod => mod.PemeriksaanAnalytics), {
    ssr: false,
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

    // Filter states
    const [searchTerm, setSearchTerm] = React.useState('');
    const [yearFilter, setYearFilter] = React.useState('all');
    const [operatorFilter, setOperatorFilter] = React.useState('all');

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
    
    const handleRecordUpdate = (updatedRecord: PemeriksaanRecord) => {
        setRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    };

    const form = useForm<PemeriksaanFormValues>({
        resolver: zodResolver(pemeriksaanFormSchema),
        defaultValues: {
            kategori: 'Accident (A)',
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

    const yearOptions = React.useMemo(() => {
        const years = [...new Set(records.map(r => getYear(parseISO(r.tanggal))))];
        return ['all', ...years.sort((a, b) => b - a)];
    }, [records]);

    const operatorOptions: ComboboxOption[] = React.useMemo(() => {
        const operators = [...new Set(records.map(r => r.operator))].sort((a, b) => a.localeCompare(b));
        return operators.map(op => ({ value: op, label: op }));
    }, [records]);

    const filteredRecords = React.useMemo(() => {
        return records.filter(record => {
            const searchTermMatch = searchTerm === '' || Object.values(record).some(value => 
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );
            const yearMatch = yearFilter === 'all' || getYear(parseISO(record.tanggal)) === parseInt(yearFilter);
            const operatorMatch = operatorFilter === 'all' || record.operator === operatorFilter;
            return searchTermMatch && yearMatch && operatorMatch;
        });
    }, [records, searchTerm, yearFilter, operatorFilter]);

    const resetFilters = () => {
        setSearchTerm('');
        setYearFilter('all');
        setOperatorFilter('all');
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
            'Kategori': record.kategori,
            'Jenis Pesawat': record.jenisPesawat,
            'Registrasi': record.registrasi,
            'Tahun Pembuatan': record.tahunPembuatan,
            'Operator': record.operator,
            'Tanggal': record.tanggal,
            'Lokasi': record.lokasi,
            'Korban': record.korban,
            'Ringkasan Kejadian': record.ringkasanKejadian,
            'Status Penanganan': record.statusPenanganan,
            'Tindak Lanjut': record.tindakLanjut,
            'File URL': record.filePemeriksaanUrl,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Pemeriksaan Records');
        XLSX.writeFile(workbook, 'pemeriksaan_records.xlsx');
    };
    
    const handleExportPdf = () => {
        if (filteredRecords.length === 0) {
            toast({ variant: "destructive", title: "No Data", description: "There is no data to generate a PDF for." });
            return;
        }
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(18);
        doc.text("Pemeriksaan Records", 14, 20);

        const tableColumn = ["Tanggal", "Kategori", "Operator", "Registrasi", "Tipe Pesawat", "Lokasi", "Korban"];
        const tableRows = filteredRecords.map(record => [
            record.tanggal,
            record.kategori,
            record.operator,
            record.registrasi,
            record.jenisPesawat,
            record.lokasi,
            record.korban
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

        doc.save("pemeriksaan_records.pdf");
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
                                        <h1 className="text-3xl font-bold">Pemeriksaan DKPPU</h1>
                                        <p className="text-muted-foreground mt-2">
                                            Data Kecelakaan (Accident & Serious Incident) yang Dilaksanakan Pemeriksaan oleh DKPPU.
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
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>Examination Records</CardTitle>
                                        <CardDescription>List of all examination records.</CardDescription>
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
                                            <Select value={String(yearFilter)} onValueChange={setYearFilter}>
                                                <SelectTrigger className="w-full sm:w-[120px]">
                                                    <SelectValue placeholder="Filter by year..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {yearOptions.map(year => (
                                                        <SelectItem key={year} value={String(year)}>{year === 'all' ? 'All Years' : year}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <div className="w-full sm:w-[200px]">
                                                <Combobox
                                                    options={[{ value: 'all', label: 'All Operators' }, ...operatorOptions]}
                                                    value={operatorFilter}
                                                    onChange={setOperatorFilter}
                                                    placeholder="Filter by operator..."
                                                />
                                            </div>
                                            {(searchTerm || yearFilter !== 'all' || operatorFilter !== 'all') && (
                                                <Button variant="ghost" onClick={resetFilters}>
                                                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                                </Button>
                                            )}
                                        </div>
                                        <PemeriksaanTable 
                                            records={filteredRecords} 
                                            onUpdate={handleRecordUpdate}
                                            searchTerm={searchTerm} 
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="analytics">
                        {isLoading ? (
                            <Skeleton className="h-[600px] w-full" />
                        ) : (
                            <PemeriksaanAnalytics allRecords={filteredRecords} />
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </AppLayout>
    );
}


'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, orderBy, Timestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { RulemakingRecord, User } from '@/lib/types';
import dynamic from 'next/dynamic';
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
import { Loader2, AlertTriangle, ListChecks, Search, FileSpreadsheet, Printer, ChevronDown } from 'lucide-react';
import { deleteRulemakingRecord } from '@/lib/actions/rulemaking';
import { AppLayout } from '@/components/app-layout-component';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { createExportRecord } from '@/lib/actions/verification';

const RulemakingForm = dynamic(() => import('@/components/rulemaking-monitoring/rulemaking-form').then(mod => mod.RulemakingForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const RulemakingTable = dynamic(() => import('@/components/rulemaking-monitoring/rulemaking-table').then(mod => mod.RulemakingTable), { 
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const RulemakingAnalytics = dynamic(() => import('@/components/rulemaking-monitoring/rulemaking-analytics').then(mod => mod.RulemakingAnalytics), { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" /> 
});

type SortDescriptor = {
    column: keyof RulemakingRecord | 'firstSubmissionDate';
    direction: 'asc' | 'desc';
} | null;


export default function RulemakingMonitoringPage() {
    const [records, setRecords] = React.useState<RulemakingRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('records');
    const { toast } = useToast();
    
    const [recordToDelete, setRecordToDelete] = React.useState<RulemakingRecord | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    // Filter and search states
    const [searchTerm, setSearchTerm] = React.useState('');
    const [kategoriFilter, setKategoriFilter] = React.useState('all');
    const [perihalFilter, setPerihalFilter] = React.useState('all');
    const [sort, setSort] = React.useState<SortDescriptor>({ column: 'firstSubmissionDate', direction: 'desc' });
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);

    React.useEffect(() => {
        const q = query(collection(db, "rulemakingRecords"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const recordsFromDb: RulemakingRecord[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                recordsFromDb.push({ 
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                } as RulemakingRecord);
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

        const loggedInUserId = localStorage.getItem('loggedInUserId');
        if (loggedInUserId) {
            getDoc(doc(db, "users", loggedInUserId)).then(userSnap => {
                if (userSnap.exists()) {
                    setCurrentUser({ id: userSnap.id, ...userSnap.data() } as User);
                }
            });
        }

        return () => unsubscribe();
    }, [toast]);
    
    const filteredAndSortedRecords = React.useMemo(() => {
        let filtered = [...records];
        
        if (kategoriFilter !== 'all') {
            filtered = filtered.filter(record => record.kategori === kategoriFilter);
        }

        if (perihalFilter !== 'all') {
            filtered = filtered.filter(record => record.perihal === perihalFilter);
        }

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filtered = filtered.filter(record => 
                record.perihal.toLowerCase().includes(lowercasedFilter) ||
                record.kategori.toLowerCase().includes(lowercasedFilter) ||
                (record.stages || []).some(stage => 
                    stage.pengajuan?.keteranganPengajuan?.toLowerCase().includes(lowercasedFilter) ||
                    stage.pengajuan?.nomor?.toLowerCase().includes(lowercasedFilter) ||
                    stage.status.deskripsi.toLowerCase().includes(lowercasedFilter) ||
                    stage.keterangan?.text?.toLowerCase().includes(lowercasedFilter)
                )
            );
        }
        
        if (sort) {
            filtered.sort((a, b) => {
                if (sort.column === 'firstSubmissionDate') {
                    const dateA = a.stages?.[0]?.pengajuan?.tanggal ? parseISO(a.stages[0].pengajuan.tanggal).getTime() : 0;
                    const dateB = b.stages?.[0]?.pengajuan?.tanggal ? parseISO(b.stages[0].pengajuan.tanggal).getTime() : 0;
                    return sort.direction === 'asc' ? dateA - dateB : dateB - dateA;
                }

                const aVal = a[sort.column as keyof RulemakingRecord] ?? '';
                const bVal = b[sort.column as keyof RulemakingRecord] ?? '';

                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }
                return 0;
            });
        }
        
        return filtered;
    }, [records, searchTerm, kategoriFilter, perihalFilter, sort]);

    const perihalOptions = React.useMemo(() => {
        const uniquePerihals = Array.from(new Set(records.map(r => r.perihal)));
        return ['all', ...uniquePerihals];
    }, [records]);
    
    const handleDeleteRequest = (record: RulemakingRecord) => {
        setRecordToDelete(record);
    };

    const handleRecordUpdate = (updatedRecord: RulemakingRecord) => {
        if (!updatedRecord || !updatedRecord.id) return;
        setRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    };

    const confirmDelete = async () => {
        if (!recordToDelete) return;

        setIsDeleting(true);
        const result = await deleteRulemakingRecord(recordToDelete.id);
        setIsDeleting(false);

        if (result.success) {
            toast({ title: "Record Deleted", description: "The record has been removed." });
            setRecords(prevRecords => prevRecords.filter(r => r.id !== recordToDelete.id));
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setRecordToDelete(null);
    };

    const handleExportExcel = () => {
        if (filteredAndSortedRecords.length === 0) {
            toast({ variant: "destructive", title: "No Data", description: "There are no records to export." });
            return;
        }

        const dataToExport = filteredAndSortedRecords.flatMap(record => {
            if (record.stages && record.stages.length > 0) {
                return record.stages.map(stage => ({
                    'Perihal': record.perihal,
                    'Kategori': record.kategori,
                    'Tanggal Pengajuan': stage.pengajuan.tanggal ? format(parseISO(stage.pengajuan.tanggal), 'yyyy-MM-dd') : 'N/A',
                    'Nomor Surat': stage.pengajuan.nomor || 'N/A',
                    'Keterangan Pengajuan': stage.pengajuan.keteranganPengajuan || 'N/A',
                    'Attachment Link': stage.pengajuan.fileUrl || 'N/A',
                    'Deskripsi Status': stage.status.deskripsi.trim(),
                    'Keterangan': stage.keterangan?.text || 'N/A',
                }));
            }
            return [{
                'Perihal': record.perihal,
                'Kategori': record.kategori,
                'Tanggal Pengajuan': 'N/A',
                'Nomor Surat': 'N/A',
                'Keterangan Pengajuan': 'N/A',
                'Attachment Link': 'N/A',
                'Deskripsi Status': 'No stages available',
                'Keterangan': 'N/A',
            }];
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rulemaking Monitoring");
        XLSX.writeFile(workbook, "rulemaking_monitoring_export.xlsx");
    };

    const handleExportPdf = async () => {
        if (filteredAndSortedRecords.length === 0) {
            toast({ variant: "destructive", title: "No Data", description: "There are no records to export." });
            return;
        }
    
        if (!currentUser) {
            toast({ variant: "destructive", title: "User not found", description: "Could not identify the current user." });
            return;
        }
    
        const exportRecord = await createExportRecord({
            documentType: 'Rulemaking Monitoring Records',
            exportedAt: new Date(),
            exportedBy: { id: currentUser.id, name: currentUser.name },
            filters: { searchTerm, kategoriFilter, perihalFilter },
        });
    
        if (!exportRecord.success || !exportRecord.id) {
            toast({ variant: "destructive", title: "Export Failed", description: "Could not create an export record for verification." });
            return;
        }
    
        const verificationUrl = `https://stdatabase.site/verify/${exportRecord.id}`;
        
        const logoUrl = 'https://ik.imagekit.io/avmxsiusm/LOGO-AIRTRACK%20black.png';
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.src = logoUrl;
    
        const generatePdf = async (logoDataUrl?: string) => {
            const doc = new jsPDF({ orientation: 'landscape' });
            
            const qrDataUrl = await QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H' });
            
            const addPageContent = (data: { pageNumber: number }) => {
                const pageCount = (doc as any).internal.getNumberOfPages();
                
                doc.setFontSize(18);
                doc.text("Rulemaking Monitoring Records", 14, 20);
                
                if (logoDataUrl) {
                    const aspectRatio = img.width / img.height;
                    const logoWidth = 30;
                    const logoHeight = aspectRatio > 0 ? logoWidth / aspectRatio : 0;
                    if (logoHeight > 0) {
                        doc.addImage(logoDataUrl, 'PNG', doc.internal.pageSize.getWidth() - (logoWidth + 15), 8, logoWidth, logoHeight);
                    }
                }
    
                const footerY = doc.internal.pageSize.height - 20;
                doc.setFontSize(8);
                doc.addImage(qrDataUrl, 'PNG', 14, footerY - 5, 15, 15);
                doc.text('Genuine Document by AirTrack', 14, footerY + 12);
                
                const copyrightText = `Copyright © AirTrack ${new Date().getFullYear()}`;
                doc.text(copyrightText, doc.internal.pageSize.width / 2, footerY + 12, { align: 'center' });
                
                doc.text(`Page ${data.pageNumber} of ${pageCount}`, doc.internal.pageSize.width - 14, footerY + 12, { align: 'right' });
            };
    
            const groupedByCategory = filteredAndSortedRecords.reduce((acc, record) => {
                const key = record.kategori;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(record);
                return acc;
            }, {} as Record<string, RulemakingRecord[]>);
            
            let isFirstPage = true;
    
            for (const kategori of Object.keys(groupedByCategory).sort()) {
                if (!isFirstPage) {
                    doc.addPage();
                }

                autoTable(doc, {
                    head: [[`Kategori: ${kategori}`]],
                    body: [[]],
                    startY: (doc as any).lastAutoTable.finalY || 30,
                    theme: 'plain',
                    headStyles: { fontStyle: 'bold', fontSize: 16 }
                });
                
                const recordsInKategori = groupedByCategory[kategori];
                const groupedByPerihal = recordsInKategori.reduce((acc, record) => {
                    const key = record.perihal;
                    if (!acc[key]) {
                        acc[key] = [];
                    }
                    acc[key].push(record);
                    return acc;
                }, {} as Record<string, RulemakingRecord[]>);
                
                for (const perihal of Object.keys(groupedByPerihal).sort()) {
                     const recordsInPerihal = groupedByPerihal[perihal];
                    const tableRows = recordsInPerihal.flatMap(record => 
                        record.stages.map(stage => [
                            stage.pengajuan.tanggal ? format(parseISO(stage.pengajuan.tanggal), 'dd-MM-yyyy') : 'N/A',
                            stage.pengajuan.nomor || 'N/A',
                            stage.pengajuan.keteranganPengajuan || 'N/A',
                            stage.status.deskripsi.trim(),
                            stage.keterangan?.text || 'N/A',
                        ])
                    );

                    autoTable(doc, {
                        head: [[`Perihal: ${perihal}`]],
                        startY: (doc as any).lastAutoTable.finalY + 2,
                        theme: 'plain',
                        headStyles: { fontStyle: 'bold', fontSize: 14, fillColor: [255, 255, 255], textColor: 0, halign: 'left' },
                        pageBreak: 'avoid',
                    });

                    autoTable(doc, {
                        head: [['Tanggal', 'No. Surat', 'Keterangan Pengajuan', 'Deskripsi Status', 'Keterangan']],
                        body: tableRows,
                        startY: (doc as any).lastAutoTable.finalY,
                        theme: 'grid',
                        headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
                        didDrawPage: addPageContent,
                        margin: { top: 30, bottom: 30 },
                    });
                }
                 isFirstPage = false;
            }
            
            doc.save("rulemaking_monitoring.pdf");
        };
    
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                generatePdf(); 
                return;
            }
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            generatePdf(dataUrl);
        };
    
        img.onerror = () => {
            toast({ variant: "destructive", title: "Logo Error", description: "Could not load logo for PDF." });
            generatePdf();
        };
    };


    return (
        <AppLayout>
            <main className="p-4 md:p-8" id="rulemaking-monitoring-page">
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <Card className="mb-4 overflow-hidden relative print:hidden">
                        <div className="flex flex-col md:flex-row">
                            <div className="flex-1 p-6 z-10">
                                <CardTitle className="text-3xl font-bold flex items-center gap-2"><ListChecks /> Monitoring</CardTitle>
                                <CardDescription className="mt-2 text-foreground/80">
                                    Ringkasan status usulan dan perubahan keputusan terkait CASR/PKPS, petunjuk teknis (SI) dan petunjuk pelaksanaan (AC).
                                </CardDescription>
                                <div className="pt-4">
                                    <TabsList>
                                        <TabsTrigger value="form">Input Form</TabsTrigger>
                                        <TabsTrigger value="records">Records</TabsTrigger>
                                    </TabsList>
                                </div>
                            </div>
                            <div className="relative w-full md:w-1/3 min-h-[150px] md:min-h-0">
                                <img
                                    src="https://ik.imagekit.io/avmxsiusm/cloud_storage_10.webp"
                                    alt="Monitoring Illustration"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="mb-4 print:hidden">
                         <CardHeader>
                            <CardTitle>Analytics</CardTitle>
                            <CardDescription>Visualisasi data berdasarkan filter yang dipilih.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <Select value={perihalFilter} onValueChange={setPerihalFilter}>
                                    <SelectTrigger className="w-full sm:w-[300px]">
                                        <SelectValue placeholder="Filter by Perihal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Perihal</SelectItem>
                                        {perihalOptions.filter(o => o !== 'all').map((option) => (
                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Kategori</SelectItem>
                                        <SelectItem value="PKPS/CASR">PKPS/CASR</SelectItem>
                                        <SelectItem value="SI">SI</SelectItem>
                                        <SelectItem value="AC">AC</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <RulemakingAnalytics records={filteredAndSortedRecords} />
                        </CardContent>
                    </Card>


                    <TabsContent value="form" className="print:hidden">
                        <div className="max-w-7xl mx-auto">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Add New Rulemaking Record</CardTitle>
                                    <CardDescription>
                                        Fill out the form to add a new record.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                   <RulemakingForm onFormSubmit={(newRecord) => { 
                                       setRecords(prev => [newRecord, ...prev]);
                                       setActiveTab('records');
                                    }} />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="records">
                        <div className="max-w-7xl mx-auto">
                            <Card>
                                <CardHeader className="print:hidden">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className='flex-1'>
                                            <CardTitle>All Records</CardTitle>
                                            <CardDescription>A list of all rulemaking monitoring records.</CardDescription>
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
                                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                        <div className="relative flex-grow">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search records..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-9 w-full"
                                            />
                                        </div>
                                        <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
                                            <SelectTrigger className="w-full sm:w-[180px]">
                                                <SelectValue placeholder="Filter by Kategori" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Kategori</SelectItem>
                                                <SelectItem value="PKPS/CASR">PKPS/CASR</SelectItem>
                                                <SelectItem value="SI">SI</SelectItem>
                                                <SelectItem value="AC">AC</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <RulemakingTable 
                                        records={filteredAndSortedRecords}
                                        onDelete={handleDeleteRequest}
                                        onUpdate={handleRecordUpdate}
                                        isLoading={isLoading}
                                        searchTerm={searchTerm}
                                        sort={sort}
                                        setSort={setSort}
                                    />
                                </CardContent>
                            </Card>
                        </div>
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
                                This will permanently delete the record for: <span className="font-semibold">{recordToDelete?.perihal}</span>.
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

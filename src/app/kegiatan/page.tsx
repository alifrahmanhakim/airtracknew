

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
import { Loader2, AlertTriangle, Plus, List, CalendarIcon, ArrowLeft, Printer } from 'lucide-react';
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
import { eachWeekOfInterval, format, startOfYear, endOfYear, getYear, parseISO, isWithinInterval, startOfWeek, endOfWeek, getISOWeek, eachMonthOfInterval, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { motion } from 'framer-motion';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    
    const [filterMode, setFilterMode] = React.useState<'week' | 'month'>('week');
    const [selectedWeek, setSelectedWeek] = React.useState<string>(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    const [selectedMonth, setSelectedMonth] = React.useState<string>(format(new Date(), 'yyyy-MM'));
    const weeklyRef = React.useRef<HTMLButtonElement>(null);
    const monthlyRef = React.useRef<HTMLButtonElement>(null);
    const [slider, setSlider] = React.useState({ left: 0, width: 0 });

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


        return () => {
            unsubscribe();
        }
    }, [toast]);
    
    React.useEffect(() => {
        const targetRef = filterMode === 'week' ? weeklyRef : monthlyRef;
        if (targetRef.current) {
          const { offsetLeft, offsetWidth } = targetRef.current;
          setSlider({ left: offsetLeft, width: offsetWidth });
        }
      }, [filterMode, weeklyRef, monthlyRef]);


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
    const weeks = eachWeekOfInterval({
        start: startOfYear(new Date(currentYear, 0, 1)),
        end: endOfYear(new Date(currentYear, 11, 31)),
    }, { weekStartsOn: 1 });
    
    const months = eachMonthOfInterval({
        start: startOfYear(new Date(currentYear, 0, 1)),
        end: endOfYear(new Date(currentYear, 11, 31)),
    });

    const filteredRecords = React.useMemo(() => {
        if (filterMode === 'week') {
            if (!selectedWeek) return records;
            const weekStart = parseISO(selectedWeek);
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

            return records.filter(record => {
                const recordStart = parseISO(record.tanggalMulai);
                const recordEnd = parseISO(record.tanggalSelesai);
                return isWithinInterval(recordStart, { start: weekStart, end: weekEnd }) ||
                       isWithinInterval(recordEnd, { start: weekStart, end: weekEnd }) ||
                       (recordStart < weekStart && recordEnd > weekEnd);
            });
        } else { // filterMode === 'month'
             if (!selectedMonth) return records;
             const monthStart = parseISO(selectedMonth);
             const monthEnd = endOfMonth(monthStart);

             return records.filter(record => {
                const recordStart = parseISO(record.tanggalMulai);
                const recordEnd = parseISO(record.tanggalSelesai);
                return isWithinInterval(recordStart, { start: monthStart, end: monthEnd }) ||
                       isWithinInterval(recordEnd, { start: monthStart, end: monthEnd }) ||
                       (recordStart < monthStart && recordEnd > monthEnd);
            });
        }
    }, [records, selectedWeek, selectedMonth, filterMode]);
    
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
            generatePdfWithLogo(dataUrl);
        };
        
        img.onerror = () => {
            toast({ variant: "destructive", title: "Logo Error", description: "Could not load logo. Exporting without it." });
            generatePdfWithLogo();
        }

        const generatePdfWithLogo = (logoDataUrl?: string) => {
            const doc = new jsPDF({ orientation: 'landscape' });

            const tableColumn = ["Subjek", "Tanggal Mulai", "Tanggal Selesai", "Nama", "Lokasi", "Catatan"];
            const tableRows = filteredRecords.map(record => [
                record.subjek,
                format(parseISO(record.tanggalMulai), 'dd MMM yyyy'),
                format(parseISO(record.tanggalSelesai), 'dd MMM yyyy'),
                record.nama.map((name, index) => `${index + 1}. ${name}`).join('\n'),
                record.lokasi,
                record.catatan || '-',
            ]);
            
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 32,
                theme: 'grid',
                headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
                didDrawPage: (data) => {
                    // Header
                    if (data.pageNumber === 1) {
                        if (logoDataUrl) {
                            const aspectRatio = img.width / img.height;
                            const logoWidth = 30;
                            const logoHeight = aspectRatio > 0 ? logoWidth / aspectRatio : 0;
                            if (logoHeight > 0) {
                                doc.addImage(logoDataUrl, 'PNG', doc.internal.pageSize.getWidth() - (logoWidth + 15), 8, logoWidth, logoHeight);
                            }
                        }
                        
                        doc.setFontSize(18);
                        doc.text("Jadwal Kegiatan Subdirektorat Standardisasi", 14, 20);

                        let subtitle = '';
                        if (filterMode === 'week') {
                            const weekStart = parseISO(selectedWeek);
                            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                            const weekNumber = getISOWeek(weekStart);
                            subtitle = `Data for Week ${weekNumber}: ${format(weekStart, 'dd MMM yyyy')} - ${format(weekEnd, 'dd MMM yyyy')}`;
                        } else {
                            const monthStart = parseISO(selectedMonth);
                            subtitle = `Data for ${format(monthStart, 'MMMM yyyy')}`;
                        }
                        doc.setFontSize(12);
                        doc.text(subtitle, 14, 26);
                    }

                    // Footer
                    doc.setFontSize(8);
                    
                    const copyrightText = `Copyright © AirTrack ${new Date().getFullYear()}`;
                    const textWidth = doc.getStringUnitWidth(copyrightText) * doc.getFontSize() / doc.internal.scaleFactor;
                    const textX = (doc.internal.pageSize.width - textWidth) / 2;
                    doc.text(copyrightText, textX, doc.internal.pageSize.height - 10);
                    
                    const pageText = `Page ${data.pageNumber} of `;
                    doc.text(pageText, 14, doc.internal.pageSize.height - 10);
                },
            });
            
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                 doc.setPage(i);
                 const pageString = `Page ${i} of ${pageCount}`;
                 doc.text(pageString, 14, doc.internal.pageSize.height - 10);
            }

            doc.save("jadwal_kegiatan.pdf");
        };
    };


    return (
        <div className="min-h-screen bg-muted/20">
        <main className="container mx-auto p-4 md:p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <Card className="mb-4 bg-background/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                 <Button asChild variant="outline" size="icon" className="transition-all hover:-translate-x-1">
                                    <Link href="/my-dashboard">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <div>
                                    <CardTitle className="text-3xl font-bold flex items-center gap-2">
                                        <List />
                                        Kegiatan Subdirektorat Standardisasi
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        Input, lacak, dan analisis semua kegiatan Subdirektorat Standardisasi.
                                    </CardDescription>
                                </div>
                            </div>
                             <Button variant="outline" onClick={handleExportPdf}>
                                <Printer className="mr-2 h-4 w-4" /> Export to PDF
                            </Button>
                        </div>
                         <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <TabsList>
                                <TabsTrigger value="form">Input Form</TabsTrigger>
                                <TabsTrigger value="records">Jadwal Kegiatan</TabsTrigger>
                                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                            </TabsList>
                             <div className="flex items-center gap-4">
                               <ToggleGroup 
                                    type="single" 
                                    value={filterMode} 
                                    onValueChange={(value: 'week' | 'month') => value && setFilterMode(value)} 
                                    className="border rounded-full p-1 bg-muted/50 relative"
                                >
                                    <motion.div
                                      className="absolute inset-0.5 bg-green-500 rounded-full z-0"
                                      initial={false}
                                      animate={slider}
                                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                    <ToggleGroupItem ref={weeklyRef} value="week" className="px-3 py-1 text-xs rounded-full data-[state=on]:bg-transparent data-[state=on]:text-white">Weekly</ToggleGroupItem>
                                    <ToggleGroupItem ref={monthlyRef} value="month" className="px-3 py-1 text-xs rounded-full data-[state=on]:bg-transparent data-[state=on]:text-white">Monthly</ToggleGroupItem>
                                </ToggleGroup>

                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                                    {filterMode === 'week' ? (
                                        <Select
                                            value={selectedWeek}
                                            onValueChange={setSelectedWeek}
                                        >
                                            <SelectTrigger className="w-[280px]">
                                                <SelectValue placeholder="Pilih Minggu" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {weeks.map(weekStart => {
                                                    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                                                    const weekNumber = getISOWeek(weekStart);
                                                    const weekLabel = `Week ${weekNumber}: ${format(weekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM yyyy')}`;
                                                    return (
                                                        <SelectItem key={weekStart.toISOString()} value={format(weekStart, 'yyyy-MM-dd')}>
                                                            {weekLabel}
                                                        </SelectItem>
                                                    )
                                                })}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Select
                                            value={selectedMonth}
                                            onValueChange={setSelectedMonth}
                                        >
                                            <SelectTrigger className="w-[280px]">
                                                <SelectValue placeholder="Pilih Bulan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {months.map(monthStart => (
                                                    <SelectItem key={monthStart.toISOString()} value={format(monthStart, 'yyyy-MM')}>
                                                        {format(monthStart, 'MMMM yyyy')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
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

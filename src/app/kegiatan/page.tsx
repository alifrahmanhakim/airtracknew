

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, where, doc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Kegiatan, Project, Task, User } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { deleteTask } from '@/lib/actions/project';
import { Loader2, AlertTriangle, List, CalendarIcon, ArrowLeft, Printer } from 'lucide-react';
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
import { eachWeekOfInterval, format, startOfYear, endOfYear, getYear, parseISO, isWithinInterval, startOfWeek, endOfWeek, getISOWeek, eachMonthOfInterval, startOfMonth, endOfMonth, isSameMonth, isValid } from 'date-fns';
import { id } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { motion } from 'framer-motion';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { deleteKegiatan } from '@/lib/actions/kegiatan';
import QRCode from 'qrcode';
import { createExportRecord } from '@/lib/actions/verification';
import { kegiatanSubditUsers } from '@/lib/data';


const KegiatanAnalytics = dynamic(() => import('@/components/kegiatan-analytics').then(mod => mod.KegiatanAnalytics), {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" />
});

const PROJECT_NAME = "Kegiatan Subdirektorat";

export default function KegiatanPage() {
    const [kegiatanRecords, setKegiatanRecords] = React.useState<Kegiatan[]>([]);
    const [allUsers, setAllUsers] = React.useState<User[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('records');
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);
    
    const [kegiatanToDelete, setKegiatanToDelete] = React.useState<Kegiatan | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    
    const [filterMode, setFilterMode] = React.useState<'week' | 'month'>('week');
    const [selectedWeek, setSelectedWeek] = React.useState<string>(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    const [selectedMonth, setSelectedMonth] = React.useState<string>(format(new Date(), 'yyyy-MM'));
    const weeklyRef = React.useRef<HTMLButtonElement>(null);
    const monthlyRef = React.useRef<HTMLButtonElement>(null);
    const [slider, setSlider] = React.useState({ left: 0, width: 0 });

    React.useEffect(() => {
        const usersQuery = query(collection(db, "users"));
        const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
            setAllUsers(snapshot.docs.map(d => ({...d.data(), id: d.id } as User)));
        });

        const kegiatanQuery = query(collection(db, "kegiatanRecords"));
        const unsubKegiatan = onSnapshot(kegiatanQuery, (snapshot) => {
            const records: Kegiatan[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                records.push({ 
                    id: doc.id,
                    ...data,
                    tanggalMulai: data.tanggalMulai?.toDate ? data.tanggalMulai.toDate().toISOString() : data.tanggalMulai,
                    tanggalSelesai: data.tanggalSelesai?.toDate ? data.tanggalSelesai.toDate().toISOString() : data.tanggalSelesai,
                } as Kegiatan);
            });
            setKegiatanRecords(records);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching kegiatan records: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch activities data.',
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

        return () => {
            unsubUsers();
            unsubKegiatan();
        };
    }, [toast]);
    
    React.useEffect(() => {
        const targetRef = filterMode === 'week' ? weeklyRef : monthlyRef;
        if (targetRef.current) {
          const { offsetLeft, offsetWidth } = targetRef.current;
          setSlider({ left: offsetLeft, width: offsetWidth });
        }
      }, [filterMode, weeklyRef, monthlyRef]);


    const handleDeleteRequest = (kegiatan: Kegiatan) => {
        setKegiatanToDelete(kegiatan);
    };

    const handleKegiatanChange = (updatedKegiatan: Kegiatan) => {
        setKegiatanRecords(prev => prev.map(k => k.id === updatedKegiatan.id ? updatedKegiatan : k));
    };
    
    const confirmDelete = async () => {
        if (!kegiatanToDelete) return;

        setIsDeleting(true);
        const result = await deleteKegiatan(kegiatanToDelete.id);
        setIsDeleting(false);

        if (result.success) {
            setKegiatanRecords(prev => prev.filter(k => k.id !== kegiatanToDelete!.id));
            toast({ title: "Kegiatan Deleted", description: "The activity has been removed." });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setKegiatanToDelete(null);
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
    
    const filteredRecords: Kegiatan[] = React.useMemo(() => {
        if (filterMode === 'week') {
            if (!selectedWeek) return kegiatanRecords;
            const weekStart = parseISO(selectedWeek);
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

            return kegiatanRecords.filter(record => {
                if (!record.tanggalMulai || !record.tanggalSelesai) return false;
                const recordStart = parseISO(record.tanggalMulai);
                const recordEnd = parseISO(record.tanggalSelesai);
                return isWithinInterval(recordStart, { start: weekStart, end: weekEnd }) ||
                       isWithinInterval(recordEnd, { start: weekStart, end: weekEnd }) ||
                       (recordStart < weekStart && recordEnd > weekEnd);
            });
        } else { // filterMode === 'month'
             if (!selectedMonth) return kegiatanRecords;
             const monthStart = parseISO(selectedMonth);
             const monthEnd = endOfMonth(monthStart);

             return kegiatanRecords.filter(record => {
                if (!record.tanggalMulai || !record.tanggalSelesai) return false;
                const recordStart = parseISO(record.tanggalMulai);
                const recordEnd = parseISO(record.tanggalSelesai);
                return isWithinInterval(recordStart, { start: monthStart, end: monthEnd }) ||
                       isWithinInterval(recordEnd, { start: monthStart, end: monthEnd }) ||
                       (recordStart < monthStart && recordEnd > monthEnd);
            });
        }
    }, [kegiatanRecords, selectedWeek, selectedMonth, filterMode]);
    
    const handleExportPdf = async () => {
        if (filteredRecords.length === 0) {
            toast({ variant: "destructive", title: "No Data", description: "There is no data to generate a PDF for." });
            return;
        }
    
        if (!currentUser) {
            toast({ variant: "destructive", title: "User not found", description: "Could not identify the current user." });
            return;
        }
    
        const exportRecord = await createExportRecord({
            documentType: 'Jadwal Kegiatan Subdirektorat',
            exportedAt: new Date(),
            exportedBy: { id: currentUser.id, name: currentUser.name },
            filters: { filterMode, ...(filterMode === 'week' ? { week: selectedWeek } : { month: selectedMonth }) },
        });
    
        if (!exportRecord.success || !exportRecord.id) {
            toast({ variant: "destructive", title: "Export Failed", description: "Could not create an export record for verification." });
            return;
        }
    
        const verificationUrl = `https://stdatabase.site/verify/${exportRecord.id}`;
        
        const logo1Url = 'https://ik.imagekit.io/avmxsiusm/LOGO-AIRTRACK%20black.png';
        const logo2Url = 'https://ik.imagekit.io/avmxsiusm/Untitled-4.png';
    
        const loadImage = (url: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = url;
                img.onload = () => resolve(img);
                img.onerror = (e) => {
                    toast({ variant: "destructive", title: "Logo Error", description: `Could not load logo from ${url}.` });
                    reject(e);
                };
            });
        };
        
        const imageToDataUrl = (img: HTMLImageElement): string | null => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) return null;
                ctx.drawImage(img, 0, 0);
                return canvas.toDataURL('image/png');
            } catch (error) {
                console.error("Canvas toDataURL error:", error);
                return null;
            }
        };
    
        try {
            const [logo1Img, logo2Img] = await Promise.all([loadImage(logo1Url), loadImage(logo2Url)]);
            const logo1DataUrl = imageToDataUrl(logo1Img);
            const logo2DataUrl = imageToDataUrl(logo2Img);
    
            const generatePdf = async () => {
                const doc = new jsPDF({ orientation: 'portrait' });
                const qrDataUrl = await QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H' });
    
                const addPageContent = (data: { pageNumber: number }) => {
                    const pageWidth = doc.internal.pageSize.getWidth();
                    doc.setFontSize(18);
                    doc.text("Jadwal Kegiatan Subdirektorat Standardisasi", 14, 20);
    
                    let currentX = pageWidth - 15;
                    const logoHeight = 10; // Fixed height for both logos
    
                    if (logo1DataUrl && logo1Img.naturalWidth > 0 && logo1Img.naturalHeight > 0) {
                        const img1Ratio = logo1Img.naturalWidth / logo1Img.naturalHeight;
                        const logo1Width = logoHeight * img1Ratio;
                        currentX -= logo1Width;
                        doc.addImage(logo1DataUrl, 'PNG', currentX, 10, logo1Width, logoHeight);
                    }
                    if (logo2DataUrl && logo2Img.naturalWidth > 0 && logo2Img.naturalHeight > 0) {
                        const img2Ratio = logo2Img.naturalWidth / logo2Img.naturalHeight;
                        const logo2Width = logoHeight * img2Ratio;
                        currentX -= (logo2Width + 5);
                        doc.addImage(logo2DataUrl, 'PNG', currentX, 10, logo2Width, logoHeight);
                    }
                    
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
                    doc.text(subtitle, 14, 28);
                };
                
                const addFooter = (data: { pageNumber: number, pageCount: number }) => {
                    const footerY = doc.internal.pageSize.height - 20;
                    doc.setFontSize(8);
                    doc.addImage(qrDataUrl, 'PNG', 14, footerY - 5, 15, 15);
                    doc.text('Genuine Document by AirTrack', 14, footerY + 12);
    
                    const copyrightText = `Copyright © AirTrack ${new Date().getFullYear()}`;
                    doc.text(copyrightText, doc.internal.pageSize.width / 2, footerY + 12, { align: 'center' });
                    
                    const pageText = `Page ${data.pageNumber} of ${data.pageCount}`;
                    doc.text(pageText, doc.internal.pageSize.width - 14, footerY + 12, { align: 'right' });
                };
    
                const tableColumn = ["Subjek", "Tanggal Mulai", "Tanggal Selesai", "Nama", "Lokasi", "Catatan"];
                const tableRows = filteredRecords.map(record => [
                    record.subjek,
                    format(parseISO(record.tanggalMulai), 'dd MMM yyyy'),
                    format(parseISO(record.tanggalSelesai), 'dd MMM yyyy'),
                    record.nama.map((name, index) => `${index + 1}. ${name}`).join('\n'),
                    record.lokasi,
                    record.catatan || 'N/A',
                ]);
    
                autoTable(doc, {
                    head: [tableColumn],
                    body: tableRows,
                    startY: 34,
                    theme: 'grid',
                    headStyles: { fillColor: [25, 25, 112], textColor: 255, fontStyle: 'bold', lineWidth: 0.15 },
                    styles: { lineWidth: 0.15, cellPadding: 2, fontSize: 8 },
                    columnStyles: { 3: { cellWidth: 'auto' } },
                    didDrawPage: addPageContent,
                    margin: { top: 34, bottom: 25 },
                });
    
                const allPersonnel = kegiatanSubditUsers.map(u => u.value);
                const involvedPersonnel = new Set(filteredRecords.flatMap(r => r.nama));
                const uninvolvedPersonnel = allPersonnel.filter(p => !involvedPersonnel.has(p));
    
                if (uninvolvedPersonnel.length > 0) {
                    const uninvolvedTableRows = uninvolvedPersonnel.map(name => [name]);
                    let startY = (doc as any).lastAutoTable.finalY + 10;
                    
                    const requiredSpace = (uninvolvedTableRows.length + 2) * 8 + 30; // 30 for footer
                    
                    if (startY + requiredSpace > doc.internal.pageSize.getHeight()) {
                        doc.addPage();
                        addPageContent({ pageNumber: (doc as any).internal.getNumberOfPages() });
                        startY = 34;
                    }
                    
                    doc.setFontSize(12);
                    doc.text('Personel yang Belum Terlibat', 14, startY);
                    
                    autoTable(doc, {
                        body: uninvolvedTableRows,
                        startY: startY + 4,
                        theme: 'grid',
                        showHead: 'firstPage',
                        headStyles: { fillColor: [100, 100, 100], textColor: 255, fontStyle: 'bold', lineWidth: 0.15 },
                        styles: { lineWidth: 0.15, cellPadding: 2, fontSize: 8 },
                        didDrawPage: addPageContent,
                        margin: { top: 34, bottom: 25 },
                    });
                }
    
                const pageCount = (doc as any).internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    addFooter({ pageNumber: i, pageCount });
                }
                
                doc.save("jadwal_kegiatan.pdf");
            };
    
            await generatePdf();
        } catch (error) {
            toast({ variant: "destructive", title: "PDF Export Failed", description: "An unexpected error occurred during PDF generation." });
            console.error("PDF Export Error:", error);
        }
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
                           <KegiatanForm 
                              onFormSubmit={(newKegiatan) => {
                                  setKegiatanRecords(prev => [...prev, newKegiatan]);
                                  setActiveTab('records');
                              }} 
                              allUsers={allUsers}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="records">
                    <KegiatanTable 
                        kegiatanList={filteredRecords}
                        onDelete={handleDeleteRequest}
                        onUpdate={handleKegiatanChange}
                        isLoading={isLoading}
                        allUsers={allUsers}
                    />
                </TabsContent>

                <TabsContent value="analytics">
                    <KegiatanAnalytics tasks={kegiatanRecords} users={allUsers}/>
                </TabsContent>
            </Tabs>

            <AlertDialog open={!!kegiatanToDelete} onOpenChange={(open) => !open && setKegiatanToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader className="text-center items-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the record for: <span className="font-semibold">{kegiatanToDelete?.subjek}</span>.
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


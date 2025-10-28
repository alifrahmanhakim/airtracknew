'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { RulemakingRecord } from '@/lib/types';
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
import { Loader2, AlertTriangle, ListChecks, Search, FileSpreadsheet } from 'lucide-react';
import { deleteRulemakingRecord } from '@/lib/actions/rulemaking';
import { AppLayout } from '@/components/app-layout-component';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';

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

    const handleExport = () => {
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
                'Deskripsi Status': 'No stages available',
                'Keterangan': 'N/A',
            }];
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rulemaking Monitoring");
        XLSX.writeFile(workbook, "rulemaking_monitoring_export.xlsx");
    };

    return (
        <AppLayout>
            <main className="p-4 md:p-8">
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold flex items-center gap-2"><ListChecks /> Rulemaking Monitoring</CardTitle>
                            <CardDescription className="mt-2">
                                Ringkasan status usulan dan perubahan keputusan terkait CASR/PKPS, petunjuk teknis (SI) dan petunjuk pelaksanaan (AC).
                            </CardDescription>
                            <div className="pt-4">
                                <TabsList>
                                    <TabsTrigger value="form">Input Form</TabsTrigger>
                                    <TabsTrigger value="records">Records</TabsTrigger>
                                </TabsList>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card className="mb-4">
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
                            </div>
                            <RulemakingAnalytics records={filteredAndSortedRecords} />
                        </CardContent>
                    </Card>


                    <TabsContent value="form">
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
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className='flex-1'>
                                            <CardTitle>All Records</CardTitle>
                                            <CardDescription>A list of all rulemaking monitoring records.</CardDescription>
                                        </div>
                                        <Button variant="outline" onClick={handleExport}>
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                            Export to Excel
                                        </Button>
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

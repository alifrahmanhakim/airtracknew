
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CcefodRecord } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { deleteAllCcefodRecords, deleteCcefodRecord } from '@/lib/actions/ccefod';
import { Loader2, FileSpreadsheet, AlertTriangle, Trash2, RotateCcw } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';


// Dynamically import heavy components
const CcefodForm = dynamic(() => import('@/components/ccefod-form').then(mod => mod.CcefodForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const CcefodRecordsTable = dynamic(() => import('@/components/ccefod-records-table').then(mod => mod.CcefodRecordsTable), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const CcefodAnalyticsDashboard = dynamic(() => import('@/components/ccefod-analytics-dashboard').then(mod => mod.CcefodAnalyticsDashboard), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const ImportCcefodCsvDialog = dynamic(() => import('@/components/import-ccefod-csv-dialog').then(mod => mod.ImportCcefodCsvDialog), {
    ssr: false
});

const implementationLevelOptions = [
    "No difference","More exacting or exceeds","Different in character or other means of compliance","Less protective or patially implemented or not implemented","Not applicable","No  Information  Provided","Insufficient  Information  Provided"
];

const RECORDS_PER_PAGE = 10;

export default function CcefodPage() {
  const [records, setRecords] = useState<CcefodRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsAnnexFilter, setAnalyticsAnnexFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('form');
  const { toast } = useToast();
  
  const [recordToDelete, setRecordToDelete] = useState<CcefodRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Filters for the records table
  const [filter, setFilter] = useState('');
  const [annexFilter, setAnnexFilter] = useState<string>('all');
  const [implementationLevelFilter, setImplementationLevelFilter] = useState<string>('all');
  const [adaPerubahanFilter, setAdaPerubahanFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const q = query(collection(db, "ccefodRecords"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recordsFromDb: CcefodRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.createdAt && data.createdAt instanceof Timestamp) {
            data.createdAt = data.createdAt.toDate().toISOString();
        }
        recordsFromDb.push({ id: doc.id, ...data } as CcefodRecord);
      });
      setRecords(recordsFromDb);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching CCEFOD records: ", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch CCEFOD records from the database.',
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const handleDeleteRequest = (record: CcefodRecord) => {
    setRecordToDelete(record);
  };

  const handleRecordUpdate = (updatedRecord: CcefodRecord) => {
    setRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
  };
  
  const confirmDelete = async () => {
    if (!recordToDelete) return;

    setIsDeleting(true);
    const result = await deleteCcefodRecord(recordToDelete.id);
    setIsDeleting(false);

    if (result.success) {
      toast({ title: "Record Deleted", description: "The CCEFOD record has been removed." });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setRecordToDelete(null);
  };
  
  const confirmDeleteAll = async () => {
    setIsDeletingAll(true);
    const result = await deleteAllCcefodRecords();
    setIsDeletingAll(false);
    setShowDeleteAllConfirm(false);

    if (result.success) {
      toast({
        title: 'All Records Deleted',
        description: `${result.count} records have been successfully removed.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Records',
        description: result.error || 'An unknown error occurred.',
      });
    }
  };


  const annexOptions = useMemo(() => {
    const annexes = Array.from(new Set(records.map(r => r.annex).filter(Boolean)));
    
    annexes.sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);

        if (!isNaN(numA) && !isNaN(numB)) {
            if (numA !== numB) return numA - numB;
        }

        return a.localeCompare(b);
    });
    
    return ['all', ...annexes];
  }, [records]);

  const filteredAnalyticsRecords = useMemo(() => {
    if (analyticsAnnexFilter === 'all') {
      return records;
    }
    return records.filter(record => record.annex === analyticsAnnexFilter);
  }, [records, analyticsAnnexFilter]);

  const confirmExport = () => {
    if (records.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No Data to Export',
            description: 'There are no records to export.',
        });
        return;
    }
    
    toast({
        title: 'Preparing Export',
        description: 'Your CSV file is being generated...',
    });

    setTimeout(() => {
        // Remove HTML tags from standardPractice before exporting
        const dataToExport = records.map(r => {
            const { standardPractice, ...rest } = r;
            const cleanStandardPractice = (standardPractice || '').replace(/<[^>]+>/g, '');
            return { ...rest, standardPractice: cleanStandardPractice };
        });

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'ccefod_records_export.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, 500);
  };
  
  const processedRecords = useMemo(() => {
    let filteredData = [...records];
    
    if (annexFilter !== 'all') {
        filteredData = filteredData.filter(record => record.annex === annexFilter);
    }
    
    if (implementationLevelFilter !== 'all') {
        filteredData = filteredData.filter(record => record.implementationLevel === implementationLevelFilter);
    }

    if (adaPerubahanFilter !== 'all') {
        filteredData = filteredData.filter(record => record.adaPerubahan === adaPerubahanFilter);
    }
    
    if (filter) {
        const lowercasedFilter = filter.toLowerCase();
        filteredData = filteredData.filter(record => 
            Object.values(record).some(value => 
                String(value).toLowerCase().includes(lowercasedFilter)
            )
        );
    }

    return filteredData;
  }, [records, filter, annexFilter, implementationLevelFilter, adaPerubahanFilter]);

  const totalPages = Math.ceil(processedRecords.length / RECORDS_PER_PAGE);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    const endIndex = startIndex + RECORDS_PER_PAGE;
    return processedRecords.slice(startIndex, endIndex);
  }, [processedRecords, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
    }
  }

  function renderContent() {
    if (isLoading) {
      return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-10 w-1/4" />
            </div>
            <Skeleton className="h-[600px] w-full" />
        </div>
      );
    }
    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="p-4 rounded-lg bg-card/80 backdrop-blur-sm">
                    <h1 className="text-3xl font-bold">CC/EFOD Monitoring</h1>
                    <p className="text-muted-foreground">
                        Formulir untuk memonitor dan mengelola Compliance Checklist dan Electronic Filing of Differences.
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                  <Suspense fallback={<Skeleton className="h-10 w-24" />}>
                    <ImportCcefodCsvDialog />
                  </Suspense>
                  <TabsList>
                      <TabsTrigger value="form">Input Form</TabsTrigger>
                      <TabsTrigger value="records">Records</TabsTrigger>
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>
                </div>
            </div>
            
            <TabsContent value="form" forceMount className={cn(activeTab !== 'form' && 'hidden')}>
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                    <CardTitle>Compliance Checklist (CC) / EFOD Form</CardTitle>
                    <CardDescription>
                        Isi formulir di bawah ini untuk menambahkan data baru. Data akan tersimpan di Firestore.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <CcefodForm onFormSubmit={() => {}} />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="analytics" forceMount className={cn(activeTab !== 'analytics' && 'hidden')}>
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle>CC/EFOD Analytics Dashboard</CardTitle>
                                <CardDescription>
                                    Visualisasi data dari catatan yang telah dimasukkan.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 print:hidden">
                                <Label htmlFor="annex-filter" className="text-sm font-medium">Filter by Annex</Label>
                                <Select value={analyticsAnnexFilter} onValueChange={setAnalyticsAnnexFilter}>
                                    <SelectTrigger id="annex-filter" className="w-full sm:w-[280px]">
                                        <SelectValue placeholder="Filter by Annex..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {annexOptions.map(annex => (
                                            <SelectItem key={annex} value={annex}>
                                                {annex === 'all' ? 'All Annexes' : annex}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {analyticsAnnexFilter !== 'all' && (
                                    <Button variant="ghost" size="icon" onClick={() => setAnalyticsAnnexFilter('all')}>
                                        <RotateCcw className="h-4 w-4" />
                                        <span className="sr-only">Reset Filter</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <CcefodAnalyticsDashboard records={filteredAnalyticsRecords} />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="records" forceMount className={cn(activeTab !== 'records' && 'hidden')}>
                <Card>
                    <CardHeader>
                        <div className='flex justify-between items-start'>
                            <div>
                                <CardTitle>CC/EFOD Records</CardTitle>
                                <CardDescription>
                                    Berikut adalah daftar data yang telah dimasukkan dari Firestore.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 print:hidden">
                                <Button variant="outline" size="icon" onClick={confirmExport}>
                                    <FileSpreadsheet className="h-4 w-4" />
                                    <span className="sr-only">Export as CSV</span>
                                 </Button>
                                 <Button variant="destructive" size="icon" onClick={() => setShowDeleteAllConfirm(true)} disabled={records.length === 0}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete All Records</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Filter records..."
                                            value={filter}
                                            onChange={e => setFilter(e.target.value)}
                                            className="pl-9 w-full"
                                        />
                                    </div>
                                    <Select value={annexFilter} onValueChange={setAnnexFilter}>
                                        <SelectTrigger><SelectValue placeholder="Filter by Annex..." /></SelectTrigger>
                                        <SelectContent>
                                            {annexOptions.map(annex => (
                                                <SelectItem key={annex} value={annex}>
                                                    {annex === 'all' ? 'All Annexes' : annex}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={implementationLevelFilter} onValueChange={setImplementationLevelFilter}>
                                        <SelectTrigger><SelectValue placeholder="Filter by Level..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Implementation Levels</SelectItem>
                                            {implementationLevelOptions.map(option => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={adaPerubahanFilter} onValueChange={setAdaPerubahanFilter}>
                                        <SelectTrigger><SelectValue placeholder="Filter by Change..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Change Statuses</SelectItem>
                                            <SelectItem value="YA">YA</SelectItem>
                                            <SelectItem value="TIDAK">TIDAK</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <CcefodRecordsTable records={paginatedRecords} onDelete={handleDeleteRequest} onUpdate={handleRecordUpdate} />
                            <Pagination>
                                <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious href="#" onClick={(e) => {e.preventDefault(); handlePageChange(currentPage - 1)}} className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''} />
                                </PaginationItem>
                                <PaginationItem>
                                    <span className="px-4 py-2 text-sm">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext href="#" onClick={(e) => {e.preventDefault(); handlePageChange(currentPage + 1)}} className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''} />
                                </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
  }

  return (
    <div className="p-4 md:p-8" id="ccefod-page">
       {renderContent()}

       <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader className="text-center items-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the record with Annex Reference <span className="font-semibold">{recordToDelete?.annexReference}</span>.
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

        <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader className="text-center items-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all <strong>{records.length}</strong> CCEFOD records from the database.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeletingAll}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeletingAll}>
                        {isDeletingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Yes, delete all records
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}

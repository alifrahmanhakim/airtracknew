
'use client';

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from 'react';
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
import * as XLSX from 'xlsx';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';


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

type SortDescriptor = {
    column: keyof CcefodRecord;
    direction: 'asc' | 'desc';
} | null;

const implementationLevelOptions = [
    "No difference","More exacting or exceeds","Different in character or other means of compliance","Less protective or patially implemented or not implemented","Not applicable","No  Information  Provided","Insufficient  Information  Provided"
];

const RECORDS_PER_PAGE = 10;

export default function CcefodPage() {
  const [allRecords, setAllRecords] = useState<CcefodRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Analytics Filters
  const [analyticsAnnexFilter, setAnalyticsAnnexFilter] = useState<string[]>([]);
  const [analyticsAdaPerubahanFilter, setAnalyticsAdaPerubahanFilter] = useState<string>('all');
  const [analyticsStatusFilter, setAnalyticsStatusFilter] = useState<string>('all');
  
  const [activeTab, setActiveTab] = useState('records');
  const { toast } = useToast();
  
  const [recordToDelete, setRecordToDelete] = useState<CcefodRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Filters and sorting for the records table
  const [searchTerm, setSearchTerm] = useState('');
  const [annexFilter, setAnnexFilter] = useState<string>('all');
  const [implementationLevelFilter, setImplementationLevelFilter] = useState<string>('all');
  const [adaPerubahanFilter, setAdaPerubahanFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<SortDescriptor>({ column: 'annex', direction: 'asc' });
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const q = query(collection(db, "ccefodRecords"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recordsFromDb: CcefodRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate().toISOString()
          : data.createdAt;
        recordsFromDb.push({ id: doc.id, ...data, createdAt } as CcefodRecord);
      });
      setAllRecords(recordsFromDb);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching all CCEFOD records: ", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch data from the database.',
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const filteredRecords = useMemo(() => {
    let filtered = [...allRecords];

    if (annexFilter !== 'all') {
      filtered = filtered.filter(r => r.annex === annexFilter);
    }
    if (implementationLevelFilter !== 'all') {
      filtered = filtered.filter(r => r.implementationLevel === implementationLevelFilter);
    }
    if (adaPerubahanFilter !== 'all') {
      filtered = filtered.filter(r => r.adaPerubahan === adaPerubahanFilter);
    }

    if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(record => 
            Object.values(record).some(value => 
                String(value).toLowerCase().includes(lowercasedTerm)
            )
        );
    }

    if (sort) {
        filtered.sort((a, b) => {
            const aVal = a[sort.column];
            const bVal = b[sort.column];
            if (aVal === undefined || aVal === null) return 1;
            if (bVal === undefined || bVal === null) return -1;

            if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return filtered;
  }, [allRecords, annexFilter, implementationLevelFilter, adaPerubahanFilter, searchTerm, sort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, annexFilter, implementationLevelFilter, adaPerubahanFilter]);

  const totalPages = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * RECORDS_PER_PAGE;
    const end = start + RECORDS_PER_PAGE;
    return filteredRecords.slice(start, end);
  }, [filteredRecords, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const handleDeleteRequest = (record: CcefodRecord) => {
    setRecordToDelete(record);
  };

  const handleRecordAdd = (newRecord: CcefodRecord) => {
    // The onSnapshot listener will automatically handle adding the record to the state.
    // We just switch the tab.
    setActiveTab('records');
  };
  
  const confirmDelete = async () => {
    if (!recordToDelete) return;

    setIsDeleting(true);
    const result = await deleteCcefodRecord(recordToDelete.id);
    setIsDeleting(false);

    if (result.success) {
      toast({ title: "Record Deleted", description: "The CCEFOD record has been removed." });
      // State will be updated by onSnapshot
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
       // State will be updated by onSnapshot
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Records',
        description: result.error || 'An unknown error occurred.',
      });
    }
  };


  const annexOptions = useMemo(() => {
    const annexes = Array.from(new Set(allRecords.map(r => r.annex).filter(Boolean)));
    
    annexes.sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);

        if (!isNaN(numA) && !isNaN(numB)) {
            if (numA !== numB) return numA - numB;
        }

        return a.localeCompare(b);
    });
    
    return ['all', ...annexes];
  }, [allRecords]);
  
  const annexSelectOptions: MultiSelectOption[] = useMemo(() => {
    return annexOptions.filter(o => o !== 'all').map(o => ({ value: o, label: o }));
  }, [annexOptions]);

  const filteredAnalyticsRecords = useMemo(() => {
    return allRecords.filter(record => {
        const annexMatch = analyticsAnnexFilter.length === 0 || analyticsAnnexFilter.includes(record.annex);
        const adaPerubahanMatch = analyticsAdaPerubahanFilter === 'all' || record.adaPerubahan === analyticsAdaPerubahanFilter;
        const statusMatch = analyticsStatusFilter === 'all' || record.status === analyticsStatusFilter;
        return annexMatch && adaPerubahanMatch && statusMatch;
    });
  }, [allRecords, analyticsAnnexFilter, analyticsAdaPerubahanFilter, analyticsStatusFilter]);

  const confirmExport = () => {
    if (allRecords.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No Data to Export',
            description: 'There are no records to export.',
        });
        return;
    }
    
    toast({
        title: 'Preparing Export',
        description: 'Your Excel file is being generated...',
    });

    setTimeout(() => {
        const dataToExport = allRecords.map(r => {
            const { standardPractice, ...rest } = r;
            const cleanStandardPractice = (standardPractice || '').replace(/<[^>]+>/g, '');
            return { ...rest, standardPractice: cleanStandardPractice };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        
        // Define column widths
        worksheet['!cols'] = [
            { wch: 10 }, // id
            { wch: 20 }, // createdAt
            { wch: 15 }, // adaPerubahan
            { wch: 30 }, // usulanPerubahan
            { wch: 50 }, // isiUsulan
            { wch: 40 }, // annex
            { wch: 20 }, // annexReference
            { wch: 60 }, // standardPractice
            { wch: 40 }, // legislationReference
            { wch: 40 }, // implementationLevel
            { wch: 50 }, // differenceText
            { wch: 50 }, // differenceReason
            { wch: 50 }, // remarks
            { wch: 15 }, // status
        ];
        
        // Apply wrap text to all cells
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                if (!worksheet[cell_ref]) continue;
                if (!worksheet[cell_ref].s) worksheet[cell_ref].s = {};
                 worksheet[cell_ref].s.alignment = { wrapText: true, vertical: 'top' };
            }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'CCEFOD Records');
        XLSX.writeFile(workbook, 'ccefod_records_export.xlsx');
    }, 500);
  };
  
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
        <div>
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
                            Isi formulir di bawah ini untuk menambahkan data baru. Data akan tersimpan di database.
                        </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <CcefodForm onFormSubmit={handleRecordAdd} />
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
                                <div className="flex items-center gap-2 print:hidden w-full sm:w-auto">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 w-full">
                                        <MultiSelect
                                            options={annexSelectOptions}
                                            onValueChange={setAnalyticsAnnexFilter}
                                            defaultValue={analyticsAnnexFilter}
                                            placeholder="Filter by Annex..."
                                            className="w-full"
                                        />
                                        <Select value={analyticsAdaPerubahanFilter} onValueChange={setAnalyticsAdaPerubahanFilter}>
                                            <SelectTrigger><SelectValue placeholder="Filter by Change..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Change Statuses</SelectItem>
                                                <SelectItem value="YA">YA</SelectItem>
                                                <SelectItem value="TIDAK">TIDAK</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={analyticsStatusFilter} onValueChange={setAnalyticsStatusFilter}>
                                            <SelectTrigger><SelectValue placeholder="Filter by Status..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="Draft">Draft</SelectItem>
                                                <SelectItem value="Final">Final</SelectItem>
                                                <SelectItem value="Existing">Existing</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    { (analyticsAnnexFilter.length > 0 || analyticsAdaPerubahanFilter !== 'all' || analyticsStatusFilter !== 'all') && (
                                        <Button variant="ghost" onClick={() => {
                                            setAnalyticsAnnexFilter([]);
                                            setAnalyticsAdaPerubahanFilter('all');
                                            setAnalyticsStatusFilter('all');
                                        }}>
                                            <RotateCcw className="mr-2 h-4 w-4" /> Reset
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
                                        Berikut adalah daftar data yang telah dimasukkan dari database.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2 print:hidden">
                                    <Button variant="outline" size="icon" onClick={confirmExport}>
                                        <FileSpreadsheet className="h-4 w-4" />
                                        <span className="sr-only">Export as Excel</span>
                                     </Button>
                                     <Button variant="destructive" size="icon" onClick={() => setShowDeleteAllConfirm(true)} disabled={allRecords.length === 0}>
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
                                                ref={searchInputRef}
                                                placeholder="Search all fields..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
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
                                <CcefodRecordsTable 
                                    records={paginatedRecords} 
                                    onDelete={handleDeleteRequest} 
                                    onUpdate={() => {}}
                                    sort={sort}
                                    setSort={setSort}
                                    searchTerm={searchTerm}
                                />
                                 <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {paginatedRecords.length} of {filteredRecords.length} records.
                                    </div>
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
                                            <PaginationNext href="#" onClick={(e) => {e.preventDefault(); handlePageChange(currentPage + 1)}} className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''} />
                                        </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
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
                    This action cannot be undone. This will permanently delete all <strong>{filteredRecords.length}</strong> CCEFOD records from the database.
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

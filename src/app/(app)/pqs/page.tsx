

'use client';

import { useState, useMemo, useEffect, Suspense, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PqRecord } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, getDocs, limit, startAfter, where, QueryConstraint, endBefore, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { deleteAllPqRecords, deletePqRecord } from '@/lib/actions/pqs';
import { Loader2, FileSpreadsheet, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';
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
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';


// Dynamically import heavy components
const PqsForm = dynamic(() => import('@/components/pqs-form').then(mod => mod.PqsForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const PqsRecordsTable = dynamic(() => import('@/components/pqs-records-table').then(mod => mod.PqsRecordsTable), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const PqsAnalyticsDashboard = dynamic(() => import('@/components/pqs-analytics-dashboard').then(mod => mod.PqsAnalyticsDashboard), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const ImportPqsCsvDialog = dynamic(() => import('@/components/import-pqs-csv-dialog').then(mod => mod.ImportPqsCsvDialog), {
    ssr: false
});

const RECORDS_PER_PAGE = 10;

export default function PqsPage() {
  const [allRecordsForAnalytics, setAllRecordsForAnalytics] = useState<PqRecord[]>([]);
  const [paginatedRecords, setPaginatedRecords] = useState<PqRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('form');
  const { toast } = useToast();
  
  const [recordToDelete, setRecordToDelete] = useState<PqRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [criticalElementFilter, setCriticalElementFilter] = useState('all');
  const [icaoStatusFilter, setIcaoStatusFilter] = useState('all');
  const [sort, setSort] = useState<{column: keyof PqRecord, direction: 'asc'|'desc'} | null>({ column: 'pqNumber', direction: 'asc' });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageDocs, setPageDocs] = useState<any[]>([]); // Stores first and last doc of each page
  const [isFetchingPage, setIsFetchingPage] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
      setPageDocs([]);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Refocus input after data fetching
  useEffect(() => {
    if (!isFetchingPage) {
      searchInputRef.current?.focus();
    }
  }, [isFetchingPage]);

  // Fetch all records once for analytics
  useEffect(() => {
    const q = query(collection(db, "pqsRecords"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recordsFromDb: PqRecord[] = [];
      querySnapshot.forEach((doc) => {
        recordsFromDb.push({ id: doc.id, ...doc.data() } as PqRecord);
      });
      setAllRecordsForAnalytics(recordsFromDb);
    }, (error) => {
      console.error("Error fetching all PQs records for analytics: ", error);
    });

    return () => unsubscribe();
  }, []);
  
  const fetchPaginatedData = useCallback(async (page: number, direction: 'next' | 'prev' | 'first') => {
    if(page < 1) return;
    setIsFetchingPage(true);

    const constraints: QueryConstraint[] = [];
    const countConstraints: QueryConstraint[] = [];

    if (criticalElementFilter !== 'all') {
        constraints.push(where('criticalElement', '==', criticalElementFilter));
        countConstraints.push(where('criticalElement', '==', criticalElementFilter));
    }
    if (icaoStatusFilter !== 'all') {
        constraints.push(where('icaoStatus', '==', icaoStatusFilter));
        countConstraints.push(where('icaoStatus', '==', icaoStatusFilter));
    }
    
    if (debouncedSearchTerm) {
        constraints.push(orderBy('pqNumber')); // Must order by the field used in range filter
        constraints.push(where('pqNumber', '>=', debouncedSearchTerm));
        constraints.push(where('pqNumber', '<=', debouncedSearchTerm + '\uf8ff'));
        
        countConstraints.push(orderBy('pqNumber'));
        countConstraints.push(where('pqNumber', '>=', debouncedSearchTerm));
        countConstraints.push(where('pqNumber', '<=', debouncedSearchTerm + '\uf8ff'));
    } else if (sort) {
        constraints.push(orderBy(sort.column, sort.direction));
    }

    if (page > 1 && direction !== 'first') {
        const cursorDocId = direction === 'next' ? pageDocs[page - 2]?.last : pageDocs[page]?.first;
        if(cursorDocId) {
            const cursorDoc = await getDoc(doc(db, 'pqsRecords', cursorDocId));
            if (cursorDoc.exists()) {
                if (direction === 'next') {
                    constraints.push(startAfter(cursorDoc));
                } else {
                    constraints.push(endBefore(cursorDoc));
                }
            }
        }
    }

    constraints.push(limit(RECORDS_PER_PAGE));
    const q = query(collection(db, "pqsRecords"), ...constraints);
    
    try {
        const countQuery = query(collection(db, "pqsRecords"), ...countConstraints);
        const countSnapshot = await getCountFromServer(countQuery);
        setTotalRecords(countSnapshot.data().count);

        const querySnapshot = await getDocs(q);
        const recordsFromDb: PqRecord[] = [];
        querySnapshot.forEach((doc) => {
            recordsFromDb.push({ id: doc.id, ...doc.data() } as PqRecord);
        });
        
        if (recordsFromDb.length > 0) {
            const firstDocId = querySnapshot.docs[0].id;
            const lastDocId = querySnapshot.docs[querySnapshot.docs.length - 1].id;
            setPageDocs(prev => {
                const newPageDocs = [...prev];
                newPageDocs[page - 1] = { first: firstDocId, last: lastDocId };
                return newPageDocs;
            });
        }
        
        setPaginatedRecords(recordsFromDb);
        setCurrentPage(page);

    } catch (error) {
        console.error("Error fetching PQs records: ", error);
        toast({
            variant: 'destructive',
            title: 'Error fetching data',
            description: 'The database query failed. This might be due to a missing index in Firestore. Please check the browser console for a link to create it.',
        });
    } finally {
        setIsLoading(false);
        setIsFetchingPage(false);
    }
  }, [sort, debouncedSearchTerm, criticalElementFilter, icaoStatusFilter, pageDocs, toast]);

  useEffect(() => {
      fetchPaginatedData(1, 'first');
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, debouncedSearchTerm, criticalElementFilter, icaoStatusFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage > currentPage) {
        fetchPaginatedData(newPage, 'next');
    } else if (newPage < currentPage) {
        fetchPaginatedData(newPage, 'prev');
    }
  };

  const totalPages = Math.ceil(totalRecords / RECORDS_PER_PAGE);

  const handleDeleteRequest = (record: PqRecord) => {
    setRecordToDelete(record);
  };

  const handleRecordUpdate = (updatedRecord: PqRecord) => {
    setPaginatedRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
  };
  
  const confirmDelete = async () => {
    if (!recordToDelete) return;

    setIsDeleting(true);
    const result = await deletePqRecord(recordToDelete.id);
    setIsDeleting(false);

    if (result.success) {
      toast({ title: "Record Deleted", description: "The Protocol Question record has been removed." });
      fetchPaginatedData(currentPage, 'first');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setRecordToDelete(null);
  };
  
  const confirmDeleteAll = async () => {
    setIsDeletingAll(true);
    const result = await deleteAllPqRecords();
    setIsDeletingAll(false);
    setShowDeleteAllConfirm(false);

    if (result.success) {
      toast({
        title: 'All Records Deleted',
        description: `${result.count} records have been successfully removed.`,
      });
      fetchPaginatedData(1, 'first');
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Records',
        description: result.error || 'An unknown error occurred.',
      });
    }
  };

  const confirmExport = () => {
    if (allRecordsForAnalytics.length === 0) {
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
        const csv = Papa.unparse(allRecordsForAnalytics);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'pqs_records_export.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="p-4 rounded-lg bg-card/80 backdrop-blur-sm">
                    <h1 className="text-3xl font-bold">Protocol Questions (PQs)</h1>
                    <p className="text-muted-foreground">
                        Manage and monitor Protocol Questions records.
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                  <Suspense fallback={<Skeleton className="h-10 w-24" />}>
                    <ImportPqsCsvDialog onImportSuccess={() => fetchPaginatedData(1, 'first')} />
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
                    <CardTitle>Protocol Question (PQ) Form</CardTitle>
                    <CardDescription>
                        Fill out the form below to add a new PQ record.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <PqsForm onFormSubmit={() => { setActiveTab('records'); fetchPaginatedData(1, 'first'); }} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="records" forceMount className={cn(activeTab !== 'records' && 'hidden')}>
                <Card>
                    <CardHeader>
                        <div className='flex justify-between items-start'>
                            <div>
                                <CardTitle>PQs Records</CardTitle>
                                <CardDescription>
                                    A list of all Protocol Questions records from Firestore.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 print:hidden">
                                <Button variant="outline" size="icon" onClick={confirmExport}>
                                    <FileSpreadsheet className="h-4 w-4" />
                                    <span className="sr-only">Export as CSV</span>
                                </Button>
                                <Button variant="destructive" size="icon" onClick={() => setShowDeleteAllConfirm(true)} disabled={allRecordsForAnalytics.length === 0}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete All Records</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <PqsRecordsTable 
                          records={paginatedRecords} 
                          onDelete={handleDeleteRequest} 
                          onUpdate={handleRecordUpdate}
                          isFetchingPage={isFetchingPage}
                          totalPages={totalPages}
                          currentPage={currentPage}
                          handlePageChange={handlePageChange}
                          sort={sort}
                          setSort={setSort}
                          filters={{ searchTerm, criticalElementFilter, icaoStatusFilter }}
                          setFilters={{ setSearchTerm, setCriticalElementFilter, setIcaoStatusFilter }}
                          searchInputRef={searchInputRef}
                        />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="analytics" forceMount className={cn(activeTab !== 'analytics' && 'hidden')}>
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle>PQs Analytics Dashboard</CardTitle>
                                <CardDescription>
                                    Visualizations of the Protocol Questions data.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <PqsAnalyticsDashboard records={allRecordsForAnalytics} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
  }

  return (
    <div className="p-4 md:p-8" id="pqs-page">
       {renderContent()}

       <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader className="text-center items-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the record with PQ Number <span className="font-semibold">{recordToDelete?.pqNumber}</span>.
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
                    This action cannot be undone. This will permanently delete all <strong>{totalRecords}</strong> PQ records from the database.
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

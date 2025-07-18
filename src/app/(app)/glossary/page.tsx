

'use client';

import { useState, useMemo, useEffect, Suspense, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { GlossaryRecord } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, getDocs, limit, startAfter, where, QueryConstraint, endBefore, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { deleteAllGlossaryRecords, deleteGlossaryRecord } from '@/lib/actions/glossary';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Dynamically import heavy components
const GlossaryForm = dynamic(() => import('@/components/glossary-form').then(mod => mod.GlossaryForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const GlossaryRecordsTable = dynamic(() => import('@/components/glossary-records-table').then(mod => mod.GlossaryRecordsTable), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const GlossaryAnalyticsDashboard = dynamic(() => import('@/components/glossary-analytics-dashboard').then(mod => mod.GlossaryAnalyticsDashboard), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const ImportGlossaryCsvDialog = dynamic(() => import('@/components/import-glossary-csv-dialog').then(mod => mod.ImportGlossaryCsvDialog), {
    ssr: false
});

type SortDescriptor = {
    column: keyof GlossaryRecord;
    direction: 'asc' | 'desc';
} | null;

const RECORDS_PER_PAGE = 10;

export default function GlossaryPage() {
  const [allRecordsForAnalytics, setAllRecordsForAnalytics] = useState<GlossaryRecord[]>([]);
  const [paginatedRecords, setPaginatedRecords] = useState<GlossaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('records');
  const { toast } = useToast();
  
  const [recordToDelete, setRecordToDelete] = useState<GlossaryRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  
  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState<SortDescriptor>({ column: 'tsu', direction: 'asc' });
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
    const q = query(collection(db, "glossaryRecords"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recordsFromDb: GlossaryRecord[] = [];
      querySnapshot.forEach((doc) => {
        recordsFromDb.push({ id: doc.id, ...doc.data() } as GlossaryRecord);
      });
      setAllRecordsForAnalytics(recordsFromDb);
    }, (error) => {
      console.error("Error fetching all Glossary records for analytics: ", error);
    });

    return () => unsubscribe();
  }, []);

  const fetchPaginatedData = useCallback(async (page: number, direction: 'next' | 'prev' | 'first') => {
    if(page < 1) return;
    setIsFetchingPage(true);

    const constraints: QueryConstraint[] = [];
    const countConstraints: QueryConstraint[] = [];

    if (statusFilter !== 'all') {
        constraints.push(where('status', '==', statusFilter));
        countConstraints.push(where('status', '==', statusFilter));
    }
    
    if (debouncedSearchTerm) {
        constraints.push(where('tsu', '>=', debouncedSearchTerm));
        constraints.push(where('tsu', '<=', debouncedSearchTerm + '\uf8ff'));
        countConstraints.push(where('tsu', '>=', debouncedSearchTerm));
        countConstraints.push(where('tsu', '<=', debouncedSearchTerm + '\uf8ff'));
    } else if (sort) {
        constraints.push(orderBy(sort.column, sort.direction));
    }

    if (page > 1 && direction !== 'first') {
        const cursorDocId = direction === 'next' ? pageDocs[page - 2]?.last : pageDocs[page]?.first;
        if(cursorDocId) {
            const cursorDoc = await getDoc(doc(db, 'glossaryRecords', cursorDocId));
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
    const q = query(collection(db, "glossaryRecords"), ...constraints);
    
    try {
        const countQuery = query(collection(db, "glossaryRecords"), ...countConstraints);
        const countSnapshot = await getCountFromServer(countQuery);
        setTotalRecords(countSnapshot.data().count);

        const querySnapshot = await getDocs(q);
        const recordsFromDb: GlossaryRecord[] = [];
        querySnapshot.forEach((doc) => {
            recordsFromDb.push({ id: doc.id, ...doc.data() } as GlossaryRecord);
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
        console.error("Error fetching Glossary records: ", error);
        toast({
            variant: 'destructive',
            title: 'Error fetching data',
            description: 'The database query failed. This might be due to a missing index in Firestore. Please check the browser console for a link to create it.',
        });
    } finally {
        setIsLoading(false);
        setIsFetchingPage(false);
    }
  }, [sort, debouncedSearchTerm, statusFilter, pageDocs, toast]);

  useEffect(() => {
      fetchPaginatedData(1, 'first');
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, debouncedSearchTerm, statusFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage > currentPage) {
        fetchPaginatedData(newPage, 'next');
    } else if (newPage < currentPage) {
        fetchPaginatedData(newPage, 'prev');
    }
  };

  const totalPages = Math.ceil(totalRecords / RECORDS_PER_PAGE);

  const handleDeleteRequest = (record: GlossaryRecord) => {
    setRecordToDelete(record);
  };

  const handleRecordUpdate = (updatedRecord: GlossaryRecord) => {
    setPaginatedRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
  };
  
  const confirmDelete = async () => {
    if (!recordToDelete) return;

    setIsDeleting(true);
    const result = await deleteGlossaryRecord(recordToDelete.id);
    setIsDeleting(false);

    if (result.success) {
      toast({ title: "Record Deleted", description: "The Glossary record has been removed." });
       fetchPaginatedData(currentPage, 'first');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setRecordToDelete(null);
  };

  const confirmDeleteAll = async () => {
    setIsDeletingAll(true);
    const result = await deleteAllGlossaryRecords();
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


  const handleExport = () => {
    if (allRecordsForAnalytics.length === 0) {
      toast({ variant: 'destructive', title: 'No Data', description: 'There are no records to export.' });
      return;
    }
    const csv = Papa.unparse(allRecordsForAnalytics);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'glossary_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export Started', description: 'Your glossary data is being downloaded.' });
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
                    <h1 className="text-3xl font-bold">Translation Analysis</h1>
                    <p className="text-muted-foreground">
                        A centralized tool for analyzing and storing translation data.
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                  <Suspense fallback={<Skeleton className="h-10 w-24" />}>
                    <ImportGlossaryCsvDialog />
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
                    <CardTitle>Add New Translation Analysis</CardTitle>
                    <CardDescription>
                        Fill out the form below to add a new analysis entry.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <GlossaryForm onFormSubmit={() => { setActiveTab('records'); fetchPaginatedData(1, 'first'); }} />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="records" forceMount className={cn(activeTab !== 'records' && 'hidden')}>
                <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Translation Records</CardTitle>
                          <CardDescription>
                              Browse and manage the list of all translation analyses.
                          </CardDescription>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Button variant="outline" onClick={handleExport} disabled={allRecordsForAnalytics.length === 0}>
                              <FileSpreadsheet className="mr-2 h-4 w-4" />
                              Export CSV
                          </Button>
                           <Button variant="destructive" onClick={() => setShowDeleteAllConfirm(true)} disabled={allRecordsForAnalytics.length === 0}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete All
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        ref={searchInputRef}
                                        placeholder="Search by TSU..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-9 w-full sm:w-[300px]"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Final">Final</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {isFetchingPage ? <div className='flex items-center justify-center p-8'><Loader2 className="mr-2 h-8 w-8 animate-spin" /> Loading...</div> :
                                <GlossaryRecordsTable 
                                    records={paginatedRecords} 
                                    onDelete={handleDeleteRequest} 
                                    onUpdate={handleRecordUpdate}
                                    sort={sort}
                                    setSort={setSort}
                                />
                            }
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
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="analytics" forceMount className={cn(activeTab !== 'analytics' && 'hidden')}>
                <Card>
                    <CardHeader>
                        <CardTitle>Analysis Analytics</CardTitle>
                        <CardDescription>
                           Insights into the translation analysis data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <GlossaryAnalyticsDashboard records={allRecordsForAnalytics} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
  }

  return (
    <div className="p-4 md:p-8" id="glossary-page">
       {renderContent()}

       <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader className="text-center items-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the record with TSU: <span className="font-semibold">{recordToDelete?.tsu}</span>.
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
                        This action cannot be undone. This will permanently delete all <strong>{totalRecords}</strong> glossary records from the database.
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

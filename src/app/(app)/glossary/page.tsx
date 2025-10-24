
'use client';

import { useState, useMemo, useEffect, Suspense, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { GlossaryRecord, User } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, getDocs, limit, startAfter, where, QueryConstraint, endBefore, getCountFromServer, getDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { deleteAllGlossaryRecords, deleteGlossaryRecord } from '@/lib/actions/glossary';
import { Loader2, FileSpreadsheet, AlertTriangle, Trash2, Printer, ChevronDown, ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parseISO } from 'date-fns';
import { AppLayout } from '@/components/app-layout-component';

// Dynamically import heavy components
const GlossaryForm = dynamic(() => import('@/components/glossary-form').then(mod => mod.GlossaryForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const GlossaryRecordsTable = dynamic(() => import('@/components/glossary-records-table').then(mod => mod.GlossaryRecordsTable), { 
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const GlossaryAnalyticsDashboard = dynamic(() => import('@/components/glossary-analytics-dashboard').then(mod => mod.GlossaryAnalyticsDashboard), { 
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const ImportGlossaryCsvDialog = dynamic(() => import('@/components/import-glossary-csv-dialog').then(mod => mod.ImportGlossaryCsvDialog), {
    ssr: false
});

type SortDescriptor = {
    column: keyof GlossaryRecord | 'createdAt';
    direction: 'asc' | 'desc';
} | null;

const RECORDS_PER_PAGE = 10;

export default function GlossaryPage() {
  const [allRecords, setAllRecords] = useState<GlossaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('records');
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [recordToDelete, setRecordToDelete] = useState<GlossaryRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  
  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState<SortDescriptor>({ column: 'createdAt', direction: 'desc' });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const huggingFaceSpaceUrl = "https://unesco-nllb.hf.space";
  const kbbiUrl = "https://kbbi.web.id/";

  // Fetch all records once for analytics
  useEffect(() => {
    const q = query(collection(db, "glossaryRecords"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recordsFromDb: GlossaryRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        recordsFromDb.push({ 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
         } as GlossaryRecord);
      });
      setAllRecords(recordsFromDb);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching all Glossary records: ", error);
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
  }, []);
  
  const isAdmin = currentUser?.role === 'Administrator' || currentUser?.role === 'Sub-Directorate Head';

  const filteredAndSortedRecords = useMemo(() => {
    let filtered = [...allRecords];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        return (
          record.tsu?.toLowerCase().includes(lowercasedTerm) ||
          record.tsa?.toLowerCase().includes(lowercasedTerm) ||
          record.editing?.toLowerCase().includes(lowercasedTerm) ||
          record.makna?.toLowerCase().includes(lowercasedTerm) ||
          record.keterangan?.toLowerCase().includes(lowercasedTerm) ||
          record.referensi?.toLowerCase().includes(lowercasedTerm)
        );
      });
    }

    // Sort
    if (sort) {
      filtered.sort((a, b) => {
        const aVal = a[sort.column as keyof GlossaryRecord] as string | undefined;
        const bVal = b[sort.column as keyof GlossaryRecord] as string | undefined;
        
        if (sort.column === 'createdAt') {
            const dateA = aVal ? parseISO(aVal).getTime() : 0;
            const dateB = bVal ? parseISO(bVal).getTime() : 0;
            return sort.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [allRecords, searchTerm, statusFilter, sort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredAndSortedRecords.length / RECORDS_PER_PAGE);
  const paginatedRecords = filteredAndSortedRecords.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE
  );


  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };


  const handleDeleteRequest = (record: GlossaryRecord) => {
    setRecordToDelete(record);
  };

  const handleRecordUpdate = (updatedRecord: GlossaryRecord) => {
    setAllRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
  };
  
  const confirmDelete = async () => {
    if (!recordToDelete) return;

    setIsDeleting(true);
    const result = await deleteGlossaryRecord(recordToDelete.id);
    setIsDeleting(false);

    if (result.success) {
      toast({ title: "Record Deleted", description: "The Glossary record has been removed." });
       // The onSnapshot will automatically update the state
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
      // The onSnapshot will automatically update the state
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Records',
        description: result.error || 'An unknown error occurred.',
      });
    }
  };


  const handleExportExcel = () => {
    if (allRecords.length === 0) {
      toast({ variant: 'destructive', title: 'No Data', description: 'There are no records to export.' });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(allRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Glossary');
    XLSX.writeFile(workbook, 'glossary_export.xlsx');
    toast({ title: 'Export Started', description: 'Your Excel file is being downloaded.' });
  };

  const handlePrint = () => {
    window.print();
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
            <Card className="mb-4 print:hidden">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className='flex-1'>
                            <h1 className="text-3xl font-bold">Translation Analysis</h1>
                            <p className="text-muted-foreground mt-2">
                                A centralized tool for analyzing and storing translation data.
                            </p>
                             <div className="mt-4">
                                <TabsList>
                                    <TabsTrigger value="form">Input Form</TabsTrigger>
                                    <TabsTrigger value="records">Records</TabsTrigger>
                                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                                    <TabsTrigger value="ai-translator">AI Translator</TabsTrigger>
                                    <TabsTrigger value="kbbi">KBBI</TabsTrigger>
                                </TabsList>
                            </div>
                        </div>
                        {isAdmin && (
                            <div className='flex items-center gap-2'>
                              <Suspense fallback={<Skeleton className="h-10 w-24" />}>
                                <ImportGlossaryCsvDialog />
                              </Suspense>
                            </div>
                        )}
                    </div>
                </CardHeader>
            </Card>
            
            <TabsContent value="form" forceMount className={cn(activeTab !== 'form' && 'hidden', 'print:hidden')}>
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                    <CardTitle>Add New Translation Analysis</CardTitle>
                    <CardDescription>
                        Fill out the form below to add a new analysis entry.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <GlossaryForm onFormSubmit={() => { setActiveTab('records'); }} />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="records" forceMount className={cn(activeTab !== 'records' && 'hidden', 'print:!block')}>
                <Card>
                    <CardHeader className="print:hidden">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Translation Records</CardTitle>
                          <CardDescription>
                              Browse and manage the list of all translation analyses.
                          </CardDescription>
                        </div>
                        <div className='flex items-center gap-2 print:hidden'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" disabled={allRecords.length === 0}>
                                Export <ChevronDown className="ml-2 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={handleExportExcel}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Export to Excel
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print to PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {isAdmin && (
                               <Button variant="destructive" onClick={() => setShowDeleteAllConfirm(true)} disabled={allRecords.length === 0}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete All
                              </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4 print:hidden">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        ref={searchInputRef}
                                        placeholder="Search across all text fields..."
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
                            
                            <GlossaryRecordsTable 
                                records={paginatedRecords} 
                                onDelete={handleDeleteRequest} 
                                onUpdate={handleRecordUpdate}
                                sort={sort}
                                setSort={setSort}
                                searchTerm={searchTerm}
                            />
                            
                             <div className="flex items-center justify-between print:hidden">
                                <div className="text-sm text-muted-foreground">
                                    Showing {paginatedRecords.length} of {filteredAndSortedRecords.length} records.
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

            <TabsContent value="analytics" forceMount className={cn(activeTab !== 'analytics' && 'hidden', 'print:hidden')}>
                <Card>
                    <CardHeader>
                        <CardTitle>Analysis Analytics</CardTitle>
                        <CardDescription>
                           Insights into the translation analysis data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <GlossaryAnalyticsDashboard records={allRecords} />
                    </CardContent>
                </Card>
            </TabsContent>

             <TabsContent value="ai-translator" forceMount className={cn(activeTab !== 'ai-translator' && 'hidden', 'print:hidden')}>
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <CardTitle>AI Translator</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full rounded-lg border bg-muted overflow-hidden" style={{ height: '1700px' }}>
                            <iframe
                            src={huggingFaceSpaceUrl}
                            className="h-full w-full"
                            title="AI Translator"
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                            ></iframe>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="kbbi" forceMount className={cn(activeTab !== 'kbbi' && 'hidden', 'print:hidden')}>
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <CardTitle>KBBI</CardTitle>
                                <CardDescription>Kamus Besar Bahasa Indonesia</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full rounded-lg border bg-muted overflow-hidden" style={{ height: '4000px' }}>
                            <iframe
                            src={kbbiUrl}
                            className="h-full w-full"
                            title="KBBI"
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                            ></iframe>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
  }

  return (
    <AppLayout>
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
                            This action cannot be undone. This will permanently delete all <strong>{allRecords.length}</strong> glossary records from the database.
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
    </AppLayout>
  );
}

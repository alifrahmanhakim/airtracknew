
'use client';

import { useState, useMemo, useEffect, Suspense, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PqRecord, User } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, getDocs, limit, startAfter, where, QueryConstraint, endBefore, getCountFromServer, getDoc, Timestamp, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { deleteAllPqRecords, deletePqRecord } from '@/lib/actions/pqs';
import { Loader2, FileSpreadsheet, AlertTriangle, Trash2, ChevronDown, Printer } from 'lucide-react';
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
import { AppLayout } from '@/components/app-layout-component';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Skeleton } from '@/components/ui/skeleton';


// Dynamically import heavy components
const PqsForm = dynamic(() => import('@/components/pqs-form').then(mod => mod.PqsForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const PqsRecordsTable = dynamic(() => import('@/components/pqs-records-table').then(mod => mod.PqsRecordsTable), { 
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const PqsAnalyticsDashboard = dynamic(() => import('@/components/pqs-analytics-dashboard').then(mod => mod.PqsAnalyticsDashboard), { 
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const ImportPqsCsvDialog = dynamic(() => import('@/components/import-pqs-csv-dialog').then(mod => mod.ImportPqsCsvDialog), {
    ssr: false
});

const RECORDS_PER_PAGE = 10;

export default function PqsPage() {
  const [allRecords, setAllRecords] = useState<PqRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('form');
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [recordToDelete, setRecordToDelete] = useState<PqRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Filters and sorting for table
  const [searchTerm, setSearchTerm] = useState('');
  const [tableIcaoStatusFilter, setTableIcaoStatusFilter] = useState('all');
  const [tableCriticalElementFilter, setTableCriticalElementFilter] = useState('all');
  const [sort, setSort] = useState<{column: keyof PqRecord, direction: 'asc'|'desc'} | null>({ column: 'pqNumber', direction: 'asc' });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filters for analytics
  const [analyticsStatusFilter, setAnalyticsStatusFilter] = useState('all');
  const [analyticsIcaoStatusFilter, setAnalyticsIcaoStatusFilter] = useState('all');
  const [analyticsCriticalElementFilter, setAnalyticsCriticalElementFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all records once
  useEffect(() => {
    const q = query(collection(db, "pqsRecords"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recordsFromDb: PqRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt;
        recordsFromDb.push({ id: doc.id, ...data, createdAt } as PqRecord);
      });
      setAllRecords(recordsFromDb);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching all PQs records: ", error);
       toast({
        variant: 'destructive',
        title: 'Error fetching data',
        description: 'Failed to fetch records from the database.',
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
  
  const isAdmin = currentUser?.role === 'Administrator' || currentUser?.role === 'Sub-Directorate Head';

  const filteredAndSortedRecords = useMemo(() => {
    let filtered = [...allRecords];

    if (tableCriticalElementFilter !== 'all') {
      filtered = filtered.filter(record => record.criticalElement === tableCriticalElementFilter);
    }
    if (tableIcaoStatusFilter !== 'all') {
      filtered = filtered.filter(record => record.icaoStatus === tableIcaoStatusFilter);
    }
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        (record.pqNumber && String(record.pqNumber).toLowerCase().includes(lowercasedTerm)) ||
        (record.protocolQuestion && record.protocolQuestion.toLowerCase().includes(lowercasedTerm))
      );
    }

    if (sort) {
      filtered.sort((a, b) => {
        const aVal = a[sort.column];
        const bVal = b[sort.column];
        if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allRecords, tableCriticalElementFilter, tableIcaoStatusFilter, searchTerm, sort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tableCriticalElementFilter, tableIcaoStatusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredAndSortedRecords.length / RECORDS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * RECORDS_PER_PAGE;
    const end = start + RECORDS_PER_PAGE;
    return filteredAndSortedRecords.slice(start, end);
  }, [filteredAndSortedRecords, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDeleteRequest = (record: PqRecord) => {
    setRecordToDelete(record);
  };

  const handleRecordUpdate = (updatedRecord: PqRecord) => {
    setAllRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
  };
  
  const confirmDelete = async () => {
    if (!recordToDelete) return;

    setIsDeleting(true);
    const result = await deletePqRecord(recordToDelete.id);
    setIsDeleting(false);

    if (result.success) {
      toast({ title: "Record Deleted", description: "The Protocol Question record has been removed." });
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
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Records',
        description: result.error || 'An unknown error occurred.',
      });
    }
  };

  const confirmExportCsv = () => {
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
        description: 'Your CSV file is being generated...',
    });

    setTimeout(() => {
        const csv = Papa.unparse(allRecords);
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
  
  const handleExportPdf = () => {
    if (allRecords.length === 0) {
        toast({ variant: "destructive", title: "No Data", description: "There is no data to generate a PDF for." });
        return;
    }

    const logoUrl = 'https://ik.imagekit.io/avmxsiusm/LOGO-AIRTRACK%20black.png';
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = logoUrl;

    const generatePdf = (logoDataUrl?: string) => {
        const doc = new jsPDF({ orientation: 'landscape' });
        
        const tableColumn = ["PQ Number", "Protocol Question", "Critical Element", "ICAO Status", "Status"];
        const tableRows = allRecords.map(record => [
            record.pqNumber,
            record.protocolQuestion,
            record.criticalElement,
            record.icaoStatus,
            record.status
        ]);
        
        const addPageContent = (data: { pageNumber: number }) => {
            if (data.pageNumber === 1) {
                doc.setFontSize(18);
                doc.text("Protocol Questions Records", 14, 20);

                if (logoDataUrl) {
                    const aspectRatio = img.width / img.height;
                    const logoWidth = 30;
                    const logoHeight = aspectRatio > 0 ? logoWidth / aspectRatio : 0;
                    if (logoHeight > 0) {
                        doc.addImage(logoDataUrl, 'PNG', doc.internal.pageSize.getWidth() - (logoWidth + 15), 8, logoWidth, logoHeight);
                    }
                }
            }
            
            doc.setFontSize(8);
            const copyrightText = `Copyright © AirTrack ${new Date().getFullYear()}`;
            const textWidth = doc.getStringUnitWidth(copyrightText) * doc.getFontSize() / doc.internal.scaleFactor;
            const textX = (doc.internal.pageSize.width - textWidth) / 2;
            doc.text(copyrightText, textX, doc.internal.pageSize.height - 10);
        };
        
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [25, 25, 112], textColor: 255, fontStyle: 'bold' },
            didDrawPage: addPageContent
        });
        
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            const pageNumText = `Page ${i} of ${pageCount}`;
            doc.text(pageNumText, 14, doc.internal.pageSize.height - 10);
        }
        
        doc.save("pqs_records.pdf");
    };

    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            toast({ variant: "destructive", title: "Canvas Error", description: "Could not create canvas context for PDF logo." });
            return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        generatePdf(dataUrl);
    };
    
    img.onerror = () => {
        toast({ variant: "destructive", title: "Logo Error", description: "Could not load logo for PDF. Exporting without it." });
        generatePdf(); // Proceed without the logo if it fails
    };
  };


  const filteredAnalyticsRecords = useMemo(() => {
    return allRecords.filter(record => {
      const statusMatch = analyticsStatusFilter === 'all' || record.status === analyticsStatusFilter;
      const icaoStatusMatch = analyticsIcaoStatusFilter === 'all' || record.icaoStatus === analyticsIcaoStatusFilter;
      const criticalElementMatch = analyticsCriticalElementFilter === 'all' || record.criticalElement === analyticsCriticalElementFilter;
      return statusMatch && icaoStatusMatch && criticalElementMatch;
    });
  }, [allRecords, analyticsStatusFilter, analyticsIcaoStatusFilter, analyticsCriticalElementFilter]);

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
            <Card className="mb-4">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                            <CardTitle className="text-3xl font-bold">Protocol Questions (PQs)</CardTitle>
                            <CardDescription className="mt-2">
                                Manage and monitor Protocol Questions records.
                            </CardDescription>
                             <div className="mt-4">
                                <TabsList>
                                  <TabsTrigger value="form">Input Form</TabsTrigger>
                                  <TabsTrigger value="records">Records</TabsTrigger>
                                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                                </TabsList>
                            </div>
                        </div>
                        {isAdmin && (
                            <div className='flex items-center gap-2'>
                              <Suspense fallback={<Skeleton className="h-10 w-24" />}>
                                <ImportPqsCsvDialog onImportSuccess={() => {}} />
                              </Suspense>
                            </div>
                        )}
                    </div>
                </CardHeader>
            </Card>
            <TabsContent value="form" forceMount className={cn(activeTab !== 'form' && 'hidden')}>
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                    <CardTitle>Protocol Question (PQ) Form</CardTitle>
                    <CardDescription>
                        Fill out the form below to add a new PQ record.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <PqsForm onFormSubmit={() => { setActiveTab('records'); }} />
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
                                    A list of all Protocol Questions records from the database.
                                </CardDescription>
                            </div>
                            {isAdmin && (
                                <div className="flex items-center gap-2 print:hidden">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            Export <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={confirmExportCsv}>
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                            Export to CSV
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleExportPdf}>
                                            <Printer className="mr-2 h-4 w-4" />
                                            Export to PDF
                                        </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button variant="destructive" size="icon" onClick={() => setShowDeleteAllConfirm(true)} disabled={allRecords.length === 0}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete All Records</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <PqsRecordsTable 
                          records={paginatedRecords} 
                          onDelete={handleDeleteRequest} 
                          onUpdate={handleRecordUpdate}
                          isFetchingPage={isLoading}
                          totalPages={totalPages}
                          currentPage={currentPage}
                          handlePageChange={handlePageChange}
                          sort={sort}
                          setSort={setSort}
                          filters={{ searchTerm, criticalElementFilter: tableCriticalElementFilter, icaoStatusFilter: tableIcaoStatusFilter }}
                          setFilters={{ setSearchTerm, setCriticalElementFilter: setTableCriticalElementFilter, setIcaoStatusFilter: setTableIcaoStatusFilter }}
                          searchInputRef={searchInputRef}
                        />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="analytics" forceMount className={cn(activeTab !== 'analytics' && 'hidden')}>
                <PqsAnalyticsDashboard 
                    allRecords={allRecords}
                    filteredRecords={filteredAnalyticsRecords}
                    filters={{ 
                        statusFilter: analyticsStatusFilter,
                        icaoStatusFilter: analyticsIcaoStatusFilter,
                        criticalElementFilter: analyticsCriticalElementFilter
                    }}
                    setFilters={{
                        setStatusFilter: setAnalyticsStatusFilter,
                        setIcaoStatusFilter: setAnalyticsIcaoStatusFilter,
                        setCriticalElementFilter: setAnalyticsCriticalElementFilter
                    }}
                />
            </TabsContent>
        </Tabs>
    );
  }

  return (
    <AppLayout>
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
                        This action cannot be undone. This will permanently delete all <strong>{allRecords.length}</strong> PQ records from the database.
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

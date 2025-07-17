
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CcefodRecord } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { deleteCcefodRecord } from '@/lib/actions';
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
import { Loader2, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';

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


export default function CcefodPage() {
  const [records, setRecords] = useState<CcefodRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsAnnexFilter, setAnalyticsAnnexFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('form');
  const { toast } = useToast();
  
  const [recordToDelete, setRecordToDelete] = useState<CcefodRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "ccefodRecords"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recordsFromDb: CcefodRecord[] = [];
      querySnapshot.forEach((doc) => {
        recordsFromDb.push({ id: doc.id, ...doc.data() } as CcefodRecord);
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

  const annexOptions = useMemo(() => {
    const annexes = new Set(records.map(r => r.annex).filter(Boolean));
    return ['all', ...Array.from(annexes)];
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
        const csv = Papa.unparse(records);
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
        setIsExporting(false);
    }, 500);
  };

  const renderContent = () => {
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
                <div>
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
                                <Button variant="outline" size="icon" onClick={() => setIsExporting(true)}>
                                    <FileSpreadsheet className="h-4 w-4" />
                                    <span className="sr-only">Export as CSV</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CcefodRecordsTable records={records} onDelete={handleDeleteRequest} onUpdate={handleRecordUpdate} />
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
                    This action cannot be undone. This will permanently delete the CCEFOD record for Annex <span className="font-semibold">{recordToDelete?.annexReference}</span>.
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

        <AlertDialog open={isExporting} onOpenChange={setIsExporting}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Export</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to export all {records.length} records as a CSV file?
                </Description>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmExport}>
                    Export
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

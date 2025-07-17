
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PqRecord } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { deletePqRecord } from '@/lib/actions';
import { Loader2, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';

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


export default function PqsPage() {
  const [records, setRecords] = useState<PqRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('form');
  const { toast } = useToast();
  
  const [recordToDelete, setRecordToDelete] = useState<PqRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "pqsRecords"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recordsFromDb: PqRecord[] = [];
      querySnapshot.forEach((doc) => {
        recordsFromDb.push({ id: doc.id, ...doc.data() } as PqRecord);
      });
      setRecords(recordsFromDb);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching PQs records: ", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch Protocol Questions records from the database.',
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const handleDeleteRequest = (record: PqRecord) => {
    setRecordToDelete(record);
  };

  const handleRecordUpdate = (updatedRecord: PqRecord) => {
    setRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
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
            link.setAttribute('download', 'pqs_records_export.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setIsExporting(false);
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
                <div>
                    <h1 className="text-3xl font-bold">Protocol Questions (PQs)</h1>
                    <p className="text-muted-foreground">
                        Manage and monitor Protocol Questions records.
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                  <Suspense fallback={<Skeleton className="h-10 w-24" />}>
                    <ImportPqsCsvDialog />
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
                       <PqsForm onFormSubmit={() => {}} />
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
                                <Button variant="outline" size="icon" onClick={() => setIsExporting(true)}>
                                    <FileSpreadsheet className="h-4 w-4" />
                                    <span className="sr-only">Export as CSV</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <PqsRecordsTable records={records} onDelete={handleDeleteRequest} onUpdate={handleRecordUpdate} />
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
                       <PqsAnalyticsDashboard records={records} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
  }

  return (
    <div className="p-4 md:p-8" id="pqs-page">
       {renderContent()}
    </div>
  );
}

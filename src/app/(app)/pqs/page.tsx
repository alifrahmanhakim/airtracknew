
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PqRecord } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { deletePqRecord } from '@/lib/actions';
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
import { Loader2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PqsForm } from '@/components/pqs-form';
import { PqsRecordsTable } from '@/components/pqs-records-table';
import { PqsAnalyticsDashboard } from '@/components/pqs-analytics-dashboard';
import { ImportPqsCsvDialog } from '@/components/import-pqs-csv-dialog';
import Papa from 'papaparse';


export default function PqsPage() {
  const [records, setRecords] = useState<PqRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('form');
  const { toast } = useToast();
  
  const [recordToDelete, setRecordToDelete] = useState<PqRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleExportCsv = () => {
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

    // Use a small timeout to allow the toast to render before the UI might freeze on large exports
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
    }, 500);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
      );
    }
    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold">Protocol Questions (PQs)</h1>
                    <p className="text-muted-foreground">
                        Manage and monitor Protocol Questions records.
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                  <ImportPqsCsvDialog />
                  <TabsList>
                      <TabsTrigger value="form">Input Form</TabsTrigger>
                      <TabsTrigger value="records">Records</TabsTrigger>
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>
                </div>
            </div>
            <div className={cn(activeTab !== 'form' && 'print:hidden')}>
                <TabsContent value="form">
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
            </div>
            <div className={cn(activeTab !== 'records' && 'print:hidden')}>
                <TabsContent value="records">
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
                                    <Button variant="outline" size="icon" onClick={handleExportCsv}>
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
            </div>
            <div className={cn(activeTab !== 'analytics' && 'print:hidden')}>
                <TabsContent value="analytics">
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
            </div>
        </Tabs>
    );
  }

  return (
    <div className="p-4 md:p-8" id="pqs-page">
       {renderContent()}
       
        <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the PQ record with number <span className="font-semibold">{recordToDelete?.pqNumber}</span>.
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
    </div>
  );
}

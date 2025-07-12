
'use client';

import { useState, useMemo, useEffect } from 'react';
import { CcefodForm } from '@/components/ccefod-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CcefodRecordsTable } from '@/components/ccefod-records-table';
import type { CcefodRecord } from '@/lib/types';
import { CcefodAnalyticsDashboard } from '@/components/ccefod-analytics-dashboard';
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
import { Loader2, Printer, FileSpreadsheet } from 'lucide-react';
import { ImportCcefodCsvDialog } from '@/components/import-ccefod-csv-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';


export default function CcefodPage() {
  const [records, setRecords] = useState<CcefodRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsAnnexFilter, setAnalyticsAnnexFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('form');
  const { toast } = useToast();
  
  const [recordToDelete, setRecordToDelete] = useState<CcefodRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handlePrint = () => {
    window.print();
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
                    <h1 className="text-3xl font-bold">CC/EFOD Monitoring</h1>
                    <p className="text-muted-foreground">
                        Formulir untuk memonitor dan mengelola Compliance Checklist dan Electronic Filing of Differences.
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                  <ImportCcefodCsvDialog />
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
            </div>
            <div className={cn(activeTab !== 'records' && 'print:hidden')}>
                <TabsContent value="records">
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
                                <Button variant="outline" size="icon" onClick={handleExportCsv}>
                                    <FileSpreadsheet className="h-4 w-4" />
                                    <span className="sr-only">Export as CSV</span>
                                </Button>
                                <Button variant="outline" size="icon" onClick={handlePrint} className="print:hidden">
                                    <Printer className="h-4 w-4" />
                                    <span className="sr-only">Print Records</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CcefodRecordsTable records={records} onDelete={handleDeleteRequest} onUpdate={handleRecordUpdate} />
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
                                    <Button variant="outline" size="icon" onClick={handlePrint}>
                                        <Printer className="h-4 w-4" />
                                        <span className="sr-only">Print Analytics</span>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CcefodAnalyticsDashboard records={filteredAnalyticsRecords} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </div>
        </Tabs>
    );
  }

  return (
    <div className="p-4 md:p-8" id="ccefod-page">
       {renderContent()}
       
        <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
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
    </div>
  );
}

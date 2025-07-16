
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { GapAnalysisRecord } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { deleteGapAnalysisRecord } from '@/lib/actions';
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
import { Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GapAnalysisForm } from '@/components/gap-analysis-form';
import { GapAnalysisRecordsTable } from '@/components/gap-analysis-records-table';
import { GapAnalysisAnalyticsDashboard } from '@/components/gap-analysis-analytics-dashboard';

export default function GapAnalysisPage() {
  const [records, setRecords] = useState<GapAnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('form');
  const { toast } = useToast();
  
  const [recordToDelete, setRecordToDelete] = useState<GapAnalysisRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "gapAnalysisRecords"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recordsFromDb: GapAnalysisRecord[] = [];
      querySnapshot.forEach((doc) => {
        recordsFromDb.push({ id: doc.id, ...doc.data() } as GapAnalysisRecord);
      });
      setRecords(recordsFromDb);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching GAP Analysis records: ", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch GAP Analysis records from the database.',
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const handleDeleteRequest = (record: GapAnalysisRecord) => {
    setRecordToDelete(record);
  };
  
  const confirmDelete = async () => {
    if (!recordToDelete) return;

    setIsDeleting(true);
    const result = await deleteGapAnalysisRecord(recordToDelete.id);
    setIsDeleting(false);

    if (result.success) {
      toast({ title: "Record Deleted", description: "The GAP Analysis record has been removed." });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setRecordToDelete(null);
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
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold">GAP Analysis</h1>
                    <p className="text-muted-foreground">
                        Manage and monitor GAP Analysis records based on State Letters.
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                  <TabsList>
                      <TabsTrigger value="form">Input Form</TabsTrigger>
                      <TabsTrigger value="records">Records</TabsTrigger>
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>
                </div>
            </div>
            
            <TabsContent value="form" className={cn(activeTab !== 'form' ? 'hidden' : '')}>
                <Card>
                    <CardHeader>
                    <CardTitle>GAP Analysis Form</CardTitle>
                    <CardDescription>
                        Fill out the form below to add a new analysis record.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <GapAnalysisForm onFormSubmit={() => {}} />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="records" className={cn(activeTab !== 'records' ? 'hidden' : '')}>
                <Card>
                    <CardHeader>
                        <CardTitle>GAP Analysis Records</CardTitle>
                        <CardDescription>
                            A list of all GAP Analysis records from Firestore.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <GapAnalysisRecordsTable records={records} onDelete={handleDeleteRequest} />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className={cn(activeTab !== 'analytics' ? 'hidden' : '')}>
                <Card>
                    <CardHeader>
                        <CardTitle>GAP Analysis Analytics Dashboard</CardTitle>
                        <CardDescription>
                            Visualizations of the GAP Analysis data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <GapAnalysisAnalyticsDashboard records={records} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
  }

  return (
    <div className="p-4 md:p-8">
       {renderContent()}
       
        <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader className="text-center items-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the record with SL Reference <span className="font-semibold">{recordToDelete?.slReferenceNumber}</span>.
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


'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { RulemakingRecord } from '@/lib/types';
import dynamic from 'next/dynamic';
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
import { Loader2, AlertTriangle, ListChecks } from 'lucide-react';
import { deleteRulemakingRecord } from '@/lib/actions/rulemaking';
import { AppLayout } from '@/components/app-layout-component';

const RulemakingForm = dynamic(() => import('@/components/rulemaking-monitoring/rulemaking-form').then(mod => mod.RulemakingForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const RulemakingTable = dynamic(() => import('@/components/rulemaking-monitoring/rulemaking-table').then(mod => mod.RulemakingTable), { 
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const RulemakingAnalytics = dynamic(() => import('@/components/rulemaking-monitoring/rulemaking-analytics').then(mod => mod.RulemakingAnalytics), { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" /> 
});


export default function RulemakingMonitoringPage() {
    const [records, setRecords] = React.useState<RulemakingRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('records');
    const { toast } = useToast();
    
    const [recordToDelete, setRecordToDelete] = React.useState<RulemakingRecord | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    React.useEffect(() => {
        const q = query(collection(db, "rulemakingRecords"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const recordsFromDb: RulemakingRecord[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                recordsFromDb.push({ 
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                } as RulemakingRecord);
            });
            setRecords(recordsFromDb);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching records: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch data from the database.',
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);
    
    const handleDeleteRequest = (record: RulemakingRecord) => {
        setRecordToDelete(record);
    };

    const confirmDelete = async () => {
        if (!recordToDelete) return;

        setIsDeleting(true);
        const result = await deleteRulemakingRecord(recordToDelete.id);
        setIsDeleting(false);

        if (result.success) {
            toast({ title: "Record Deleted", description: "The record has been removed." });
            // onSnapshot will handle UI update
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setRecordToDelete(null);
    };
    
    const handleRecordUpdate = (updatedRecord: RulemakingRecord) => {
        setRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    };

    return (
        <AppLayout>
            <main className="p-4 md:p-8">
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold flex items-center gap-2"><ListChecks /> Rulemaking Monitoring</CardTitle>
                            <CardDescription className="mt-2">
                                Ringkasan status usulan dan perubahan keputusan terkait petunjuk teknis (SI) dan petunjuk pelaksanaan (AC).
                            </CardDescription>
                            <div className="pt-4">
                                <TabsList>
                                    <TabsTrigger value="form">Input Form</TabsTrigger>
                                    <TabsTrigger value="records">Records</TabsTrigger>
                                </TabsList>
                            </div>
                        </CardHeader>
                    </Card>

                    <RulemakingAnalytics records={records} />

                    <TabsContent value="form">
                        <Card>
                            <CardHeader>
                                <CardTitle>Add New Rulemaking Record</CardTitle>
                                <CardDescription>
                                    Fill out the form to add a new record.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                               <RulemakingForm onFormSubmit={() => setActiveTab('records')} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="records">
                        <Card>
                            <CardHeader>
                                <CardTitle>All Records</CardTitle>
                                <CardDescription>A list of all rulemaking monitoring records.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RulemakingTable 
                                    records={records}
                                    onDelete={handleDeleteRequest}
                                    onUpdate={handleRecordUpdate}
                                    isLoading={isLoading}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                 </Tabs>

                 <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader className="text-center items-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the record for: <span className="font-semibold">{recordToDelete?.perihal}</span>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </AppLayout>
    );
}

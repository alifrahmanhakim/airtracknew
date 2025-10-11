'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { GapAnalysisRecord, Project } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { deleteGapAnalysisRecord } from '@/lib/actions/gap-analysis';
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
import { Loader2, AlertTriangle, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GapAnalysisForm } from '@/components/gap-analysis-form';
import { GapAnalysisRecordsTable } from '@/components/gap-analysis-records-table';
import { GapAnalysisAnalyticsDashboard } from '@/components/gap-analysis-analytics-dashboard';

export default function StateLetterPage() {
  const [records, setRecords] = useState<GapAnalysisRecord[]>([]);
  const [rulemakingProjects, setRulemakingProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('form');
  const { toast } = useToast();
  
  const [recordToDelete, setRecordToDelete] = useState<GapAnalysisRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter states - centralized here
  const [statusFilter, setStatusFilter] = useState('all');
  const [annexFilter, setAnnexFilter] = useState('all');
  const [casrFilter, setCasrFilter] = useState('all');
  const [textFilter, setTextFilter] = useState('');

  const resetFilters = () => {
    setStatusFilter('all');
    setAnnexFilter('all');
    setCasrFilter('all');
    setTextFilter('');
  };
  
  useEffect(() => {
    const fetchRulemakingProjects = async () => {
        try {
            const projectsQuerySnapshot = await getDocs(collection(db, "rulemakingProjects"));
            const projectsFromDb: Project[] = projectsQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            setRulemakingProjects(projectsFromDb);
        } catch (error) {
            console.error("Error fetching rulemaking projects: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch Rulemaking projects for selection.',
            });
        }
    }

    const q = query(collection(db, "gapAnalysisRecords"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recordsFromDb: GapAnalysisRecord[] = [];
      querySnapshot.forEach((doc) => {
        recordsFromDb.push({ id: doc.id, ...doc.data() } as GapAnalysisRecord);
      });
      setRecords(recordsFromDb);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching State Letter records: ", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch State Letter records from the database.',
      });
      setIsLoading(false);
    });

    fetchRulemakingProjects();

    return () => unsubscribe();
  }, [toast]);

  const annexOptions = useMemo(() => ['all', ...Array.from(new Set(records.map(r => r.annex).filter(Boolean)))], [records]);
  const casrOptions = useMemo(() => ['all', ...Array.from(new Set(records.flatMap(r => r.evaluations.map(e => e.casrAffected)))).sort()], [records]);
  
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const statusMatch = statusFilter === 'all' || record.statusItem === statusFilter;
      const annexMatch = annexFilter === 'all' || record.annex === annexFilter;
      const casrMatch = casrFilter === 'all' || record.evaluations.some(e => e.casrAffected === casrFilter);
      
      const textMatch = textFilter === '' || 
        Object.values(record).some(value =>
            String(value).toLowerCase().includes(textFilter.toLowerCase())
        ) ||
        record.evaluations.some(e => Object.values(e).some(val => String(val).toLowerCase().includes(textFilter.toLowerCase())));


      return statusMatch && annexMatch && casrMatch && textMatch;
    });
  }, [records, statusFilter, annexFilter, casrFilter, textFilter]);
  
  const handleDeleteRequest = (record: GapAnalysisRecord) => {
    setRecordToDelete(record);
  };
  
  const handleRecordAdd = () => {
    // The onSnapshot listener will automatically handle adding the record.
    setActiveTab('records');
  };
  
  const handleRecordUpdate = (updatedRecord: GapAnalysisRecord) => {
    setRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;

    setIsDeleting(true);
    const result = await deleteGapAnalysisRecord(recordToDelete.id);
    setIsDeleting(false);

    if (result.success) {
      toast({ title: "Record Deleted", description: "The State Letter record has been removed." });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setRecordToDelete(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
      );
    }
    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold flex items-center gap-2"><Mail /> State Letter</CardTitle>
                    <CardDescription className="mt-2">
                        Manage and monitor State Letter records.
                    </CardDescription>
                    <div className="pt-4">
                        <TabsList>
                          <TabsTrigger value="form">Input Form</TabsTrigger>
                          <TabsTrigger value="records">Records</TabsTrigger>
                          <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>
                    </div>
                </CardHeader>
            </Card>
            
            <TabsContent value="form" className={cn(activeTab !== 'form' ? 'hidden' : '')}>
                <Card>
                    <CardHeader>
                    <CardTitle>State Letter Form</CardTitle>
                    <CardDescription>
                        Fill out the form below to add a new analysis record.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <GapAnalysisForm onFormSubmit={handleRecordAdd} rulemakingProjects={rulemakingProjects} />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="records" className={cn(activeTab !== 'records' ? 'hidden' : '')}>
                <Card>
                    <CardHeader>
                        <CardTitle>State Letter Records</CardTitle>
                        <CardDescription>
                            A list of all State Letter records from the database.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <GapAnalysisRecordsTable 
                            records={filteredRecords} 
                            onDelete={handleDeleteRequest} 
                            onUpdate={handleRecordUpdate}
                            filters={{ statusFilter, annexFilter, casrFilter, textFilter }}
                            setFilters={{ setStatusFilter, setAnnexFilter, setCasrFilter, setTextFilter }}
                            filterOptions={{ annexOptions, casrOptions }}
                            onResetFilters={resetFilters}
                        />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className={cn(activeTab !== 'analytics' ? 'hidden' : '')}>
                <Card>
                    <CardHeader>
                        <CardTitle>State Letter Analytics</CardTitle>
                        <CardDescription>
                            Visualizations of the State Letter data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <GapAnalysisAnalyticsDashboard records={filteredRecords} />
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

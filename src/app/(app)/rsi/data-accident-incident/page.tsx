
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AccidentIncidentRecord } from '@/lib/types';
import dynamic from 'next/dynamic';

const AccidentIncidentForm = dynamic(() => import('@/components/rsi/accident-incident-form').then(mod => mod.AccidentIncidentForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const AccidentIncidentTable = dynamic(() => import('@/components/rsi/accident-incident-table').then(mod => mod.AccidentIncidentTable), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});

export default function DataAccidentIncidentPage() {
    const [records, setRecords] = React.useState<AccidentIncidentRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('records');
    const { toast } = useToast();

    React.useEffect(() => {
        const q = query(collection(db, "accidentIncidentRecords"), orderBy("tanggal", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const recordsFromDb: AccidentIncidentRecord[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const createdAt = data.createdAt instanceof Timestamp 
                ? data.createdAt.toDate().toISOString()
                : data.createdAt;
                recordsFromDb.push({ id: doc.id, ...data, createdAt } as AccidentIncidentRecord);
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
    
    const handleFormSubmit = () => {
        setActiveTab('records');
        // No need to manually add to state, onSnapshot will handle it
    };

    return (
        <main className="p-4 md:p-8">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div className="p-4 rounded-lg bg-card/80 backdrop-blur-sm">
                        <h1 className="text-3xl font-bold">Data Accident & Serious Incident</h1>
                        <p className="text-muted-foreground">
                            Manage and view accident and serious incident records.
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <TabsList>
                            <TabsTrigger value="form">Input Form</TabsTrigger>
                            <TabsTrigger value="records">Records</TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                <TabsContent value="form">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Record</CardTitle>
                            <CardDescription>Fill out the form to add a new accident or serious incident record.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AccidentIncidentForm onFormSubmit={handleFormSubmit} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="records">
                    <Card>
                        <CardHeader>
                            <CardTitle>Records</CardTitle>
                            <CardDescription>List of all accident and serious incident records.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-[600px] w-full" />
                            ) : (
                                <AccidentIncidentTable records={records} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    );
}

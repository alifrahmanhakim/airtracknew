

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { LawEnforcementRecord } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { lawEnforcementFormSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { addLawEnforcementRecord } from '@/lib/actions/law-enforcement';

const LawEnforcementForm = dynamic(() => import('@/components/rsi/law-enforcement-form').then(mod => mod.LawEnforcementForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const LawEnforcementTable = dynamic(() => import('@/components/rsi/law-enforcement-table').then(mod => mod.LawEnforcementTable), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const LawEnforcementAnalytics = dynamic(() => import('@/components/rsi/law-enforcement-analytics').then(mod => mod.LawEnforcementAnalytics), {
    loading: () => <Skeleton className="h-[600px] w-full" />
});

type LawEnforcementFormValues = z.infer<typeof lawEnforcementFormSchema>;

export default function LawEnforcementPage() {
    const [records, setRecords] = React.useState<LawEnforcementRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('records');
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<LawEnforcementFormValues>({
        resolver: zodResolver(lawEnforcementFormSchema),
        defaultValues: {
            impositionType: 'aoc',
            references: [{ id: `ref-${Date.now()}`, sanctionType: '', refLetter: '', dateLetter: new Date() }],
            sanctionedAoc: [{ value: '' }],
            sanctionedPersonnel: [{ value: '' }],
            sanctionedOrganization: [{ value: '' }],
        },
    });

    React.useEffect(() => {
        const q = query(collection(db, "lawEnforcementRecords"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const recordsFromDb: LawEnforcementRecord[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                recordsFromDb.push({ 
                    id: doc.id, 
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                 } as LawEnforcementRecord);
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

    const handleRecordUpdate = (updatedRecord: LawEnforcementRecord) => {
        setRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    };

    const handleFormSuccess = () => {
        setActiveTab('records');
    }
    
    const onSubmit = async (data: LawEnforcementFormValues) => {
        setIsSubmitting(true);
        const result = await addLawEnforcementRecord(data);
        setIsSubmitting(false);

        if (result.success) {
            toast({ title: 'Record Added', description: 'The new sanction record has been successfully added.' });
            form.reset({
                impositionType: 'aoc',
                references: [{ id: `ref-${Date.now()}`, sanctionType: '', refLetter: '', dateLetter: new Date() }],
                sanctionedAoc: [{ value: '' }],
                sanctionedPersonnel: [],
                sanctionedOrganization: [],
            });
            handleFormSuccess();
        } else {
            toast({
                variant: 'destructive',
                title: 'Error Adding Record',
                description: result.error || 'An unknown error occurred.',
            });
        }
    };


    return (
        <main className="p-4 md:p-8">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <Card className="mb-4">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <Button asChild variant="outline" size="icon" className="transition-all hover:-translate-x-1">
                                    <Link href="/rsi">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-3xl font-bold">List of Law Enforcement</h1>
                                    <p className="text-muted-foreground mt-2">
                                        Manage and monitor law enforcement sanctions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <TabsList>
                            <TabsTrigger value="form">Input Form</TabsTrigger>
                            <TabsTrigger value="records">Records</TabsTrigger>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>
                    </CardContent>
                </Card>

                <TabsContent value="form">
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <Card>
                             <CardHeader>
                                <CardTitle>Add New Sanction</CardTitle>
                                <CardDescription>Fill out the form to add a new law enforcement record.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <LawEnforcementForm form={form} isSubmitting={isSubmitting} />
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Record
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </TabsContent>

                <TabsContent value="records">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sanction Records</CardTitle>
                            <CardDescription>List of all law enforcement records.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-[600px] w-full" />
                            ) : (
                                <LawEnforcementTable records={records} onUpdate={handleRecordUpdate} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="analytics">
                     <Card>
                        <CardHeader>
                            <CardTitle>Analytics</CardTitle>
                            <CardDescription>Visualizations of the law enforcement data.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <LawEnforcementAnalytics allRecords={records} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    );
}

    

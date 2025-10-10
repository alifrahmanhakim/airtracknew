
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AccidentIncidentRecord } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Search, Loader2, ArrowLeft } from 'lucide-react';
import { getYear, parseISO, format } from 'date-fns';
import { ComboboxOption } from '@/components/ui/combobox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accidentIncidentFormSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { addAccidentIncidentRecord } from '@/lib/actions/accident-incident';
import { aocOptions } from '@/lib/data';
import Link from 'next/link';

const AccidentIncidentForm = dynamic(() => import('@/components/rsi/accident-incident-form').then(mod => mod.AccidentIncidentForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const AccidentIncidentTable = dynamic(() => import('@/components/rsi/accident-incident-table').then(mod => mod.AccidentIncidentTable), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const AccidentIncidentAnalytics = dynamic(() => import('@/components/rsi/accident-incident-analytics').then(mod => mod.AccidentIncidentAnalytics), {
    loading: () => <Skeleton className="h-[800px] w-full" />
});

type AccidentIncidentFormValues = z.infer<typeof accidentIncidentFormSchema>;

export default function DataAccidentIncidentPage() {
    const [records, setRecords] = React.useState<AccidentIncidentRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('records');
    const { toast } = useToast();

    // Filter states for table
    const [searchTerm, setSearchTerm] = React.useState('');
    const [aocFilter, setAocFilter] = React.useState('all');
    const [yearFilter, setYearFilter] = React.useState('all');
    
    // Form state
    const [isSubmitting, setIsSubmitting] = React.useState(false);

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
    
    const yearOptions = React.useMemo(() => {
        const years = [...new Set(records.map(r => getYear(parseISO(r.tanggal))))];
        return ['all', ...years.sort((a, b) => b - a)];
    }, [records]);

    const filteredTableRecords = React.useMemo(() => {
        return records.filter(record => {
            const searchTermMatch = searchTerm === '' || Object.values(record).some(value => 
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );
            const aocMatch = aocFilter === 'all' || record.aoc === aocFilter;
            const yearMatch = yearFilter === 'all' || getYear(parseISO(record.tanggal)) === parseInt(yearFilter);

            return searchTermMatch && aocMatch && yearMatch;
        });
    }, [records, searchTerm, aocFilter, yearFilter]);

    const handleFormSubmitSuccess = () => {
        setActiveTab('records');
    };
    
    const handleRecordUpdate = (updatedRecord: AccidentIncidentRecord) => {
        setRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    };

    const resetTableFilters = () => {
        setSearchTerm('');
        setAocFilter('all');
        setYearFilter('all');
    };
    
    const form = useForm<AccidentIncidentFormValues>({
        resolver: zodResolver(accidentIncidentFormSchema),
        defaultValues: {
            tanggal: format(new Date(), 'yyyy-MM-dd'),
            kategori: 'Accident (A)',
            aoc: '',
            registrasiPesawat: '',
            tipePesawat: '',
            lokasi: '',
            taxonomy: '',
            keteranganKejadian: '',
            adaKorbanJiwa: 'Tidak Ada',
            jumlahKorbanJiwa: '',
            fileUrl: '',
        },
    });

    const onFormSubmit = async (data: AccidentIncidentFormValues) => {
        setIsSubmitting(true);
        const result = await addAccidentIncidentRecord(data);
        setIsSubmitting(false);

        if (result.success) {
            toast({ title: 'Record Added', description: 'The new record has been successfully added.' });
            form.reset();
            handleFormSubmitSuccess();
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.error || 'Failed to add the record.',
            });
        }
    };


    return (
        <main className="p-4 md:p-8">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="icon">
                            <Link href="/rsi">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div className="p-4 rounded-lg bg-card/80 backdrop-blur-sm">
                            <h1 className="text-3xl font-bold">Data Accident &amp; Serious Incident</h1>
                            <p className="text-muted-foreground">
                                Manage and view accident and serious incident records.
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-2'>
                        <TabsList>
                            <TabsTrigger value="form">Input Form</TabsTrigger>
                            <TabsTrigger value="records">Records</TabsTrigger>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                            <AccidentIncidentForm form={form} onSubmit={onFormSubmit} />
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button type="submit" form="accident-incident-form" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Record
                            </Button>
                        </CardFooter>
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
                                <>
                                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                    <div className="relative flex-grow">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search all fields..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Select value={aocFilter} onValueChange={setAocFilter}>
                                        <SelectTrigger className="w-full sm:w-[200px]">
                                            <SelectValue placeholder="Filter by AOC..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {aocOptions.map(op => (
                                                <SelectItem key={op.value} value={op.value}>{op.label === 'all' ? 'All AOCs' : op.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                     <Select value={String(yearFilter)} onValueChange={setYearFilter}>
                                        <SelectTrigger className="w-full sm:w-[120px]">
                                            <SelectValue placeholder="Filter by year..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {yearOptions.map(year => (
                                                <SelectItem key={year} value={String(year)}>{year === 'all' ? 'All Years' : year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {(searchTerm || aocFilter !== 'all' || yearFilter !== 'all') && (
                                         <Button variant="ghost" onClick={resetTableFilters}>
                                            <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                        </Button>
                                    )}
                                </div>
                                <AccidentIncidentTable records={filteredTableRecords} onUpdate={handleRecordUpdate} searchTerm={searchTerm} />
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics">
                    {isLoading ? (
                        <Skeleton className="h-[800px] w-full" />
                    ) : (
                        <AccidentIncidentAnalytics allRecords={records} />
                    )}
                </TabsContent>
            </Tabs>
        </main>
    );
}

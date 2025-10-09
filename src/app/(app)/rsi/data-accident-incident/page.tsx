
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Search } from 'lucide-react';
import { getYear, parseISO } from 'date-fns';
import { ComboboxOption } from '@/components/ui/combobox';

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

    // Filter states
    const [searchTerm, setSearchTerm] = React.useState('');
    const [operatorFilter, setOperatorFilter] = React.useState('all');
    const [yearFilter, setYearFilter] = React.useState('all');

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
    
    const operatorOptions = React.useMemo(() => {
        const operators = [...new Set(records.map(r => r.operator))];
        return ['all', ...operators.sort()];
    }, [records]);

    const operatorComboboxOptions: ComboboxOption[] = React.useMemo(() => {
        return operatorOptions.filter(op => op !== 'all').map(op => ({ value: op, label: op }));
    }, [operatorOptions]);

    const yearOptions = React.useMemo(() => {
        const years = [...new Set(records.map(r => getYear(parseISO(r.tanggal))))];
        return ['all', ...years.sort((a, b) => b - a)];
    }, [records]);

    const filteredRecords = React.useMemo(() => {
        return records.filter(record => {
            const searchTermMatch = searchTerm === '' || Object.values(record).some(value => 
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );
            const operatorMatch = operatorFilter === 'all' || record.operator === operatorFilter;
            const yearMatch = yearFilter === 'all' || getYear(parseISO(record.tanggal)) === parseInt(yearFilter);

            return searchTermMatch && operatorMatch && yearMatch;
        });
    }, [records, searchTerm, operatorFilter, yearFilter]);

    const handleFormSubmit = () => {
        setActiveTab('records');
        // No need to manually add to state, onSnapshot will handle it
    };

    const resetFilters = () => {
        setSearchTerm('');
        setOperatorFilter('all');
        setYearFilter('all');
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
                            <AccidentIncidentForm onFormSubmit={handleFormSubmit} operatorOptions={operatorComboboxOptions} />
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
                                    <Select value={operatorFilter} onValueChange={setOperatorFilter}>
                                        <SelectTrigger className="w-full sm:w-[200px]">
                                            <SelectValue placeholder="Filter by operator..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {operatorOptions.map(op => (
                                                <SelectItem key={op} value={op}>{op === 'all' ? 'All Operators' : op}</SelectItem>
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
                                    {(searchTerm || operatorFilter !== 'all' || yearFilter !== 'all') && (
                                         <Button variant="ghost" onClick={resetFilters}>
                                            <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                        </Button>
                                    )}
                                </div>
                                <AccidentIncidentTable records={filteredRecords} />
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    );
}

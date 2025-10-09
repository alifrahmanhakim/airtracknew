
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { KnktReport } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Search } from 'lucide-react';
import { getYear, parseISO } from 'date-fns';

const KnktReportsTable = dynamic(() => import('@/components/rsi/knkt-reports-table').then(mod => mod.KnktReportsTable), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});

export default function LaporanInvestigasiKnktPage() {
    const [records, setRecords] = React.useState<KnktReport[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    // Filter states
    const [searchTerm, setSearchTerm] = React.useState('');
    const [operatorFilter, setOperatorFilter] = React.useState('all');
    const [yearFilter, setYearFilter] = React.useState('all');
    const [statusFilter, setStatusFilter] = React.useState('all');

    React.useEffect(() => {
        const q = query(collection(db, "knktReports"), orderBy("tanggal_diterbitkan", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const recordsFromDb: KnktReport[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                recordsFromDb.push({ id: doc.id, ...data } as KnktReport);
            });
            setRecords(recordsFromDb);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching KNKT reports: ", error);
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

    const yearOptions = React.useMemo(() => {
        const years = [...new Set(records.map(r => getYear(parseISO(r.tanggal_diterbitkan))))];
        return ['all', ...years.sort((a, b) => b - a)];
    }, [records]);
    
    const statusOptions = React.useMemo(() => {
        const statuses = [...new Set(records.map(r => r.status))];
        return ['all', ...statuses.sort()];
    }, [records]);

    const filteredRecords = React.useMemo(() => {
        return records.filter(record => {
            const searchTermMatch = searchTerm === '' || Object.values(record).some(value => 
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );
            const operatorMatch = operatorFilter === 'all' || record.operator === operatorFilter;
            const yearMatch = yearFilter === 'all' || getYear(parseISO(record.tanggal_diterbitkan)) === parseInt(yearFilter);
            const statusMatch = statusFilter === 'all' || record.status === statusFilter;

            return searchTermMatch && operatorMatch && yearMatch && statusMatch;
        });
    }, [records, searchTerm, operatorFilter, yearFilter, statusFilter]);

    const resetFilters = () => {
        setSearchTerm('');
        setOperatorFilter('all');
        setYearFilter('all');
        setStatusFilter('all');
    };

    return (
        <main className="p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Laporan Investigasi KNKT</CardTitle>
                    <CardDescription>
                        Daftar semua laporan investigasi yang diterbitkan oleh KNKT.
                    </CardDescription>
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
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[160px]">
                                    <SelectValue placeholder="Filter by status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map(s => (
                                        <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</SelectItem>
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
                            {(searchTerm || operatorFilter !== 'all' || yearFilter !== 'all' || statusFilter !== 'all') && (
                                <Button variant="ghost" onClick={resetFilters}>
                                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                </Button>
                            )}
                        </div>
                        <KnktReportsTable records={filteredRecords} />
                        </>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}

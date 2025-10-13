
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LawEnforcementRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ArrowUpDown, Info, AlertTriangle, Loader2, Link as LinkIcon, RotateCcw, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format, getYear, parseISO, isValid } from 'date-fns';
import { deleteLawEnforcementRecord } from '@/lib/actions/law-enforcement';
import { EditLawEnforcementRecordDialog } from './edit-law-enforcement-record-dialog';
import { Highlight } from '../ui/highlight';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type LawEnforcementTableProps = {
  records: LawEnforcementRecord[];
  onUpdate: (record: LawEnforcementRecord) => void;
};

type SortDescriptor = {
    column: keyof LawEnforcementRecord | 'dateLetterFirst';
    direction: 'asc' | 'desc';
} | null;

export function LawEnforcementTable({ records, onUpdate }: LawEnforcementTableProps) {
    const { toast } = useToast();
    const [sort, setSort] = React.useState<SortDescriptor>({ column: 'dateLetterFirst', direction: 'desc' });
    const [recordToDelete, setRecordToDelete] = React.useState<LawEnforcementRecord | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [yearFilter, setYearFilter] = React.useState('all');

    const handleSort = (column: keyof LawEnforcementRecord | 'dateLetterFirst') => {
        setSort(prevSort => {
            if (prevSort?.column === column) {
                return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { column, direction: 'asc' };
        });
    };

    const renderSortIcon = (column: keyof LawEnforcementRecord | 'dateLetterFirst') => {
        if (sort?.column !== column) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
        return sort.direction === 'asc' ? <ArrowUpDown className="h-4 w-4 ml-2" /> : <ArrowUpDown className="h-4 w-4 ml-2" />;
    };

    const yearOptions = React.useMemo(() => {
        const years = new Set(records.flatMap(r => 
            (r.references || []).map(ref => {
                try {
                    if (ref.dateLetter) {
                         const date = parseISO(ref.dateLetter);
                         if(isValid(date)) return getYear(date);
                    }
                } catch (e) {
                    // Ignore invalid date formats during this calculation
                }
                return null;
            }).filter(year => year !== null) as number[]
        ));
        return ['all', ...Array.from(years).sort((a, b) => b - a)];
    }, [records]);


    const filteredAndSortedRecords = React.useMemo(() => {
        let filtered = [...records];
        
        if (searchTerm) {
             const lowercasedTerm = searchTerm.toLowerCase();
             filtered = filtered.filter(record => 
                Object.values(record).some(value => {
                    if (typeof value === 'string') return value.toLowerCase().includes(lowercasedTerm);
                    if (Array.isArray(value)) {
                        return value.some(item => 
                            Object.values(item).some(val => String(val).toLowerCase().includes(lowercasedTerm))
                        )
                    }
                    return false;
                })
             );
        }
        
        if (yearFilter !== 'all') {
            filtered = filtered.filter(record => 
                (record.references || []).some(ref => {
                    try {
                        if (ref.dateLetter) {
                            const date = parseISO(ref.dateLetter);
                            if(isValid(date)) return getYear(date) === parseInt(yearFilter);
                        }
                    } catch (e) {
                        return false;
                    }
                    return false;
                })
            );
        }


        if (sort) {
            filtered.sort((a, b) => {
                if (sort.column === 'dateLetterFirst') {
                    const dateA = a.references?.[0]?.dateLetter ? parseISO(a.references[0].dateLetter).getTime() : 0;
                    const dateB = b.references?.[0]?.dateLetter ? parseISO(b.references[0].dateLetter).getTime() : 0;
                    return sort.direction === 'asc' ? dateA - dateB : dateB - dateA;
                }

                const valA = a[sort.column as keyof LawEnforcementRecord] ?? '';
                const valB = b[sort.column as keyof LawEnforcementRecord] ?? '';

                return sort.direction === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
            });
        }
        
        return filtered;
    }, [records, sort, searchTerm, yearFilter]);

    const handleDeleteRequest = (record: LawEnforcementRecord) => {
        setRecordToDelete(record);
    };
    
    const resetFilters = () => {
        setSearchTerm('');
        setYearFilter('all');
    };

    const confirmDelete = async () => {
        if (!recordToDelete) return;
        setIsDeleting(true);
        const result = await deleteLawEnforcementRecord(recordToDelete.id);
        setIsDeleting(false);
        if (result.success) {
            toast({ title: 'Record Deleted', description: 'The record has been removed.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setRecordToDelete(null);
    };

    const renderImposition = (record: LawEnforcementRecord) => {
        const items = record[record.impositionType === 'aoc' ? 'sanctionedAoc' : record.impositionType === 'personnel' ? 'sanctionedPersonnel' : 'sanctionedOrganization'] || [];
        
        let title = '';
        switch(record.impositionType) {
            case 'aoc': title = 'AOC'; break;
            case 'personnel': title = 'Personnel'; break;
            case 'organization': title = 'Organization'; break;
        }

        return (
            <div>
                <p className="font-semibold capitalize mb-1">{title}</p>
                <ul className="list-disc pl-5 space-y-1">
                    {items.map((p, i) => <li key={i}><Highlight text={p.value} query={searchTerm}/></li>)}
                </ul>
            </div>
        );
    };

    const formatUrl = (url: string) => {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return `https://${url}`;
        }
        return url;
    };


    return (
        <>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                     <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search all fields..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by year..." />
                        </SelectTrigger>
                        <SelectContent>
                            {yearOptions.map(year => (
                                <SelectItem key={year} value={String(year)}>
                                    {year === 'all' ? 'All Years' : year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {(searchTerm || yearFilter !== 'all') && (
                        <Button variant="ghost" onClick={resetFilters}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Reset
                        </Button>
                    )}
                </div>
                <div className="border rounded-md w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">No</TableHead>
                                <TableHead className="min-w-[200px]">Imposition of Sanction to</TableHead>
                                <TableHead className="min-w-[400px] cursor-pointer" onClick={() => handleSort('dateLetterFirst')}>
                                    <div className="flex items-center">
                                        References
                                        {renderSortIcon('dateLetterFirst')}
                                    </div>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedRecords.length > 0 ? filteredAndSortedRecords.map((record, index) => (
                                <TableRow key={record.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="align-top">{renderImposition(record)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-2">
                                        {(record.references || []).map(ref => {
                                            let dateDisplay = 'N/A';
                                            if (ref.dateLetter) {
                                                try {
                                                    const parsedDate = parseISO(ref.dateLetter);
                                                    if (isValid(parsedDate)) {
                                                        dateDisplay = format(parsedDate, 'dd-MMM-yy');
                                                    }
                                                } catch (e) {
                                                    // keep original if not valid date
                                                    dateDisplay = ref.dateLetter;
                                                }
                                            }
                                            return (
                                                <div key={ref.id} className="text-sm p-2 border-l-2 pl-3">
                                                    <p><strong className="font-semibold">Type:</strong> <Highlight text={ref.sanctionType} query={searchTerm} /></p>
                                                    <p><strong className="font-semibold">Ref. Letter:</strong> <Highlight text={ref.refLetter} query={searchTerm} /></p>
                                                    <p><strong className="font-semibold">Date:</strong> <Highlight text={dateDisplay} query={searchTerm} /></p>
                                                    {ref.fileUrl && (
                                                        <Button asChild variant="link" size="sm" className="p-0 h-auto">
                                                            <a href={formatUrl(ref.fileUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                                <LinkIcon className="h-3 w-3" /> View File
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right align-top">
                                        <EditLawEnforcementRecordDialog record={record} onRecordUpdate={onUpdate} />
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteRequest(record)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        <Info className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                                        No records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
             <AlertDialog open={!!recordToDelete} onOpenChange={(open) => setRecordToDelete(open ? recordToDelete : null)}>
                <AlertDialogContent>
                    <AlertDialogHeader className="text-center items-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone and will permanently delete this record.
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
        </>
    );
}

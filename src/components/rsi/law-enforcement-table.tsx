

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
import { Pencil, Trash2, ArrowUpDown, Info, AlertTriangle, Loader2 } from 'lucide-react';
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
import { format, parseISO } from 'date-fns';
import { deleteLawEnforcementRecord } from '@/lib/actions/law-enforcement';
import { EditLawEnforcementRecordDialog } from './edit-law-enforcement-record-dialog';
import { Highlight } from '../ui/highlight';

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

        if (sort) {
            filtered.sort((a, b) => {
                if (sort.column === 'dateLetterFirst') {
                    const dateA = a.references && a.references[0] ? parseISO(a.references[0].dateLetter).getTime() : 0;
                    const dateB = b.references && b.references[0] ? parseISO(b.references[0].dateLetter).getTime() : 0;
                    return sort.direction === 'asc' ? dateA - dateB : dateB - dateA;
                }

                const valA = a[sort.column as keyof LawEnforcementRecord] ?? '';
                const valB = b[sort.column as keyof LawEnforcementRecord] ?? '';

                return sort.direction === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
            });
        }
        
        return filtered;
    }, [records, sort, searchTerm]);

    const handleDeleteRequest = (record: LawEnforcementRecord) => {
        setRecordToDelete(record);
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
        switch (record.impositionType) {
            case 'aoc':
                return (
                    <ul className="list-disc pl-5">
                        {record.sanctionedAoc?.map((p, i) => <li key={i}><Highlight text={p.value} query={searchTerm}/></li>)}
                    </ul>
                );
            case 'personnel':
                return (
                    <ul className="list-disc pl-5">
                        {record.sanctionedPersonnel?.map((p, i) => <li key={i}><Highlight text={p.value} query={searchTerm}/></li>)}
                    </ul>
                );
            case 'organization':
                 return (
                    <ul className="list-disc pl-5">
                        {record.sanctionedOrganization?.map((p, i) => <li key={i}><Highlight text={p.value} query={searchTerm}/></li>)}
                    </ul>
                );
            default:
                return 'N/A';
        }
    };

    return (
        <>
            <div className="border rounded-md overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">No</TableHead>
                            <TableHead className="min-w-[200px]">Imposition of Sanction to</TableHead>
                            <TableHead className="min-w-[400px]">References</TableHead>
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
                                    {(record.references || []).map(ref => (
                                        <div key={ref.id} className="text-sm p-2 border-l-2 pl-3">
                                            <p><strong className="font-semibold">Type:</strong> <Highlight text={ref.sanctionType} query={searchTerm} /></p>
                                            <p><strong className="font-semibold">Ref. Letter:</strong> <Highlight text={ref.refLetter} query={searchTerm} /></p>
                                            <p><strong className="font-semibold">Date:</strong> <Highlight text={format(parseISO(ref.dateLetter), 'dd-MMM-yy')} query={searchTerm} /></p>
                                        </div>
                                    ))}
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
                                <TableCell colSpan={6} className="text-center h-24">
                                     <Info className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                                     No records found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
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

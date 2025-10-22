

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
import type { AccidentIncidentRecord } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ArrowUpDown, Info, AlertTriangle, Loader2, Link as LinkIcon } from 'lucide-react';
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
import { format, parseISO, isValid } from 'date-fns';
import { deleteAccidentIncidentRecord } from '@/lib/actions/accident-incident';
import { Highlight } from '../ui/highlight';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '../ui/pagination';
import { cn } from '@/lib/utils';
import { EditAccidentIncidentRecordDialog } from './edit-accident-incident-dialog';

type AccidentIncidentTableProps = {
  records: AccidentIncidentRecord[];
  onEdit: (record: AccidentIncidentRecord) => void;
  searchTerm: string;
};

type SortDescriptor = {
    column: keyof AccidentIncidentRecord;
    direction: 'asc' | 'desc';
} | null;

const RECORDS_PER_PAGE = 5;

export function AccidentIncidentTable({ records, onEdit, searchTerm }: AccidentIncidentTableProps) {
    const { toast } = useToast();
    const [sort, setSort] = React.useState<SortDescriptor>({ column: 'tanggal', direction: 'desc' });
    const [recordToDelete, setRecordToDelete] = React.useState<AccidentIncidentRecord | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState(1);

    const handleSort = (column: keyof AccidentIncidentRecord) => {
        setSort(prevSort => {
            if (prevSort?.column === column) {
                return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { column, direction: 'asc' };
        });
    };

    const renderSortIcon = (column: keyof AccidentIncidentRecord) => {
        if (sort?.column !== column) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
        return sort.direction === 'asc' ? <ArrowUpDown className="h-4 w-4 ml-2" /> : <ArrowUpDown className="h-4 w-4 ml-2" />;
    };

    const sortedRecords = React.useMemo(() => {
        let sorted = [...records];
        if (sort) {
            sorted.sort((a, b) => {
                const aVal = a[sort.column];
                const bVal = b[sort.column];
                
                if (sort.column === 'tanggal') {
                    const dateA = aVal && isValid(parseISO(aVal)) ? parseISO(aVal).getTime() : 0;
                    const dateB = bVal && isValid(parseISO(bVal)) ? parseISO(bVal).getTime() : 0;
                    return sort.direction === 'asc' 
                        ? dateA - dateB
                        : dateB - dateA;
                }

                if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return sorted;
    }, [records, sort]);
    
    const totalPages = Math.ceil(sortedRecords.length / RECORDS_PER_PAGE);
    const paginatedRecords = sortedRecords.slice((currentPage - 1) * RECORDS_PER_PAGE, currentPage * RECORDS_PER_PAGE);

    const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
      }
    };

    const handleDeleteRequest = (e: React.MouseEvent, record: AccidentIncidentRecord) => {
        e.stopPropagation();
        setRecordToDelete(record);
    };

    const confirmDelete = async () => {
        if (!recordToDelete) return;
        setIsDeleting(true);
        const result = await deleteAccidentIncidentRecord(recordToDelete.id);
        setIsDeleting(false);
        if (result.success) {
            toast({ title: 'Record Deleted', description: 'The record has been removed.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setRecordToDelete(null);
    };

    const formatDateSafe = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            if(isValid(date)) {
                return format(date, 'dd-MMM-yy');
            }
        } catch (e) {
            // Catches invalid date strings for parseISO
        }
        return 'Invalid Date';
    }

    return (
        <>
            <div className="border rounded-md w-full overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer w-[120px]" onClick={() => handleSort('tanggal')}><div className="flex items-center">Tanggal {renderSortIcon('tanggal')}</div></TableHead>
                            <TableHead className="w-[150px]">Kategori</TableHead>
                            <TableHead className="w-[200px]">AOC</TableHead>
                            <TableHead className="w-[120px]">Registrasi</TableHead>
                            <TableHead className="w-[200px]">Tipe Pesawat</TableHead>
                            <TableHead className="w-[200px]">Lokasi</TableHead>
                            <TableHead className="w-[200px]">Taxonomy</TableHead>
                            <TableHead className="w-[50px]">File</TableHead>
                            <TableHead className="text-right w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedRecords.length > 0 ? paginatedRecords.map((record) => (
                            <TableRow key={record.id} onClick={() => onEdit(record)} className="cursor-pointer">
                                <TableCell><Highlight text={record.tanggal ? formatDateSafe(record.tanggal) : 'N/A'} query={searchTerm} /></TableCell>
                                <TableCell>
                                    <Badge variant={record.kategori === 'Accident (A)' ? 'destructive' : 'secondary'} className={cn(record.kategori === 'Serious Incident (SI)' && 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200')}>
                                        <Highlight text={record.kategori} query={searchTerm} />
                                    </Badge>
                                </TableCell>
                                <TableCell><Highlight text={record.aoc} query={searchTerm} /></TableCell>
                                <TableCell><Highlight text={record.registrasiPesawat} query={searchTerm} /></TableCell>
                                <TableCell><Highlight text={record.tipePesawat} query={searchTerm} /></TableCell>
                                <TableCell><Highlight text={record.lokasi} query={searchTerm} /></TableCell>
                                <TableCell><Highlight text={record.taxonomy} query={searchTerm} /></TableCell>
                                <TableCell>
                                    {record.fileUrl ? (
                                        <Button asChild variant="ghost" size="icon">
                                            <a href={record.fileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                <LinkIcon className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">None</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => handleDeleteRequest(e, record)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center h-24">
                                     <Info className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                                     No records found for the current filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
             <Pagination className="mt-4">
                <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''} />
                </PaginationItem>
                <PaginationItem>
                    <span className="px-4 py-2 text-sm">
                    Page {currentPage} of {totalPages}
                    </span>
                </PaginationItem>
                <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''} />
                </PaginationItem>
                </PaginationContent>
            </Pagination>
             <AlertDialog open={!!recordToDelete} onOpenChange={(open) => setRecordToDelete(open ? recordToDelete : null)}>
                <AlertDialogContent>
                    <AlertDialogHeader className="text-center items-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the record for registration <span className="font-semibold">{recordToDelete?.registrasiPesawat}</span> on <span className="font-semibold">{recordToDelete?.tanggal ? formatDateSafe(recordToDelete.tanggal) : ''}</span>.
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

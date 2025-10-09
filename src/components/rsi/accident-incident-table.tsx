
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
import { Pencil, Trash2, ArrowUpDown, Search, Info, AlertTriangle, Loader2 } from 'lucide-react';
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
import { Input } from '../ui/input';
import { deleteAccidentIncidentRecord } from '@/lib/actions/accident-incident';

type AccidentIncidentTableProps = {
  records: AccidentIncidentRecord[];
};

type SortDescriptor = {
    column: keyof AccidentIncidentRecord;
    direction: 'asc' | 'desc';
} | null;

export function AccidentIncidentTable({ records }: AccidentIncidentTableProps) {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sort, setSort] = React.useState<SortDescriptor>({ column: 'tanggal', direction: 'desc' });
    const [recordToDelete, setRecordToDelete] = React.useState<AccidentIncidentRecord | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

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

    const filteredAndSortedRecords = React.useMemo(() => {
        let filtered = [...records];

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(record => 
                Object.values(record).some(value => 
                    String(value).toLowerCase().includes(lowercasedTerm)
                )
            );
        }

        if (sort) {
            filtered.sort((a, b) => {
                const aVal = a[sort.column];
                const bVal = b[sort.column];
                
                if (sort.column === 'tanggal') {
                    return sort.direction === 'asc' 
                        ? new Date(aVal).getTime() - new Date(bVal).getTime()
                        : new Date(bVal).getTime() - new Date(aVal).getTime();
                }

                if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return filtered;
    }, [records, searchTerm, sort]);

    const handleDeleteRequest = (record: AccidentIncidentRecord) => {
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

    return (
        <>
            <div className="flex justify-end mb-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search all fields..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('tanggal')}><div className="flex items-center">Tanggal {renderSortIcon('tanggal')}</div></TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Operator</TableHead>
                            <TableHead>Registrasi</TableHead>
                            <TableHead>Tipe Pesawat</TableHead>
                            <TableHead>Lokasi</TableHead>
                            <TableHead>Wilayah</TableHead>
                            <TableHead>Taxonomy</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedRecords.length > 0 ? filteredAndSortedRecords.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell>{format(parseISO(record.tanggal), 'dd-MMM-yy')}</TableCell>
                                <TableCell>
                                    <Badge variant={record.kategori === 'Accident (A)' ? 'destructive' : 'secondary'}>
                                        {record.kategori}
                                    </Badge>
                                </TableCell>
                                <TableCell>{record.operator}</TableCell>
                                <TableCell>{record.registrasiPesawat}</TableCell>
                                <TableCell>{record.tipePesawat}</TableCell>
                                <TableCell>{record.lokasi}</TableCell>
                                <TableCell>{record.wilayah}</TableCell>
                                <TableCell>{record.taxonomy}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" disabled>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteRequest(record)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center h-24">
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
                            This will permanently delete the record for registration <span className="font-semibold">{recordToDelete?.registrasiPesawat}</span> on <span className="font-semibold">{recordToDelete?.tanggal ? format(parseISO(recordToDelete.tanggal), 'PPP') : ''}</span>.
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

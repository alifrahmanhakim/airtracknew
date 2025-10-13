
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
import type { PemeriksaanRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ArrowUpDown, Info, Loader2, Link as LinkIcon, AlertTriangle } from 'lucide-react';
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
import { deletePemeriksaanRecord } from '@/lib/actions/pemeriksaan';
import { EditPemeriksaanRecordDialog } from './edit-pemeriksaan-record-dialog';
import { Highlight } from '../ui/highlight';

type PemeriksaanTableProps = {
  records: PemeriksaanRecord[];
  onUpdate: (record: PemeriksaanRecord) => void;
  searchTerm: string;
};

type SortDescriptor = {
    column: keyof PemeriksaanRecord;
    direction: 'asc' | 'desc';
} | null;

const BulletList = ({ text, searchTerm }: { text: string; searchTerm: string }) => {
    if (!text) return null;
    const items = text.split(/\\n-?|\s*-\s*/).filter(item => item.trim() !== '');
    if (items.length === 0) return <p className="whitespace-pre-wrap"><Highlight text={text} query={searchTerm} /></p>;

    return (
      <ul className="list-disc pl-5 space-y-1">
        {items.map((item, index) => (
          <li key={index}><Highlight text={item.trim()} query={searchTerm} /></li>
        ))}
      </ul>
    );
};

export function PemeriksaanTable({ records, onUpdate, searchTerm }: PemeriksaanTableProps) {
    const { toast } = useToast();
    const [sort, setSort] = React.useState<SortDescriptor>({ column: 'tanggal', direction: 'desc' });
    const [recordToDelete, setRecordToDelete] = React.useState<PemeriksaanRecord | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleSort = (column: keyof PemeriksaanRecord) => {
        setSort(prevSort => {
            if (prevSort?.column === column) {
                return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { column, direction: 'asc' };
        });
    };

    const renderSortIcon = (column: keyof PemeriksaanRecord) => {
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
                    return sort.direction === 'asc' 
                        ? new Date(aVal).getTime() - new Date(bVal).getTime()
                        : new Date(bVal).getTime() - new Date(aVal).getTime();
                }

                if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return sorted;
    }, [records, sort]);

    const handleDeleteRequest = (record: PemeriksaanRecord) => {
        setRecordToDelete(record);
    };

    const confirmDelete = async () => {
        if (!recordToDelete) return;
        setIsDeleting(true);
        const result = await deletePemeriksaanRecord(recordToDelete.id);
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
            <div className="border rounded-md w-full overflow-x-auto">
                <Table className="table-fixed">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px] text-left">No</TableHead>
                            <TableHead className="w-[25%] text-left">Kejadian</TableHead>
                            <TableHead className="w-[25%] text-left">Status Penanganan</TableHead>
                            <TableHead className="w-[25%] text-left">Tindak Lanjut</TableHead>
                            <TableHead className="w-[150px] text-left">File Pemeriksaan</TableHead>
                            <TableHead className="text-right w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedRecords.length > 0 ? sortedRecords.map((record, index) => (
                            <TableRow key={record.id}>
                                <TableCell className="align-top text-left">{index + 1}</TableCell>
                                <TableCell className="align-top text-left break-words">
                                    <div className="font-medium space-y-2">
                                        <p><strong className='font-semibold'>Kategori:</strong> <Highlight text={record.kategori} query={searchTerm} /></p>
                                        <p><strong className='font-semibold'>Jenis Pesawat:</strong> <Highlight text={record.jenisPesawat} query={searchTerm} /></p>
                                        <p><strong className='font-semibold'>Registrasi:</strong> <Highlight text={record.registrasi} query={searchTerm} /></p>
                                        <p><strong className='font-semibold'>Tahun Pembuatan:</strong> <Highlight text={record.tahunPembuatan} query={searchTerm} /></p>
                                        <p><strong className='font-semibold'>Operator:</strong> <Highlight text={record.operator} query={searchTerm} /></p>
                                        <p><strong className='font-semibold'>Tanggal:</strong> <Highlight text={format(parseISO(record.tanggal), 'dd MMMM yyyy')} query={searchTerm} /></p>
                                        <p><strong className='font-semibold'>Lokasi:</strong> <Highlight text={record.lokasi} query={searchTerm} /></p>
                                        <p><strong className='font-semibold'>Korban:</strong> <Highlight text={record.korban} query={searchTerm} /></p>
                                        <p className="whitespace-pre-wrap"><strong className='font-semibold'>Ringkasan:</strong> <Highlight text={record.ringkasanKejadian} query={searchTerm} /></p>
                                    </div>
                                </TableCell>
                                <TableCell className="align-top text-left break-words"><BulletList text={record.statusPenanganan} searchTerm={searchTerm} /></TableCell>
                                <TableCell className="align-top text-left break-words"><BulletList text={record.tindakLanjut} searchTerm={searchTerm} /></TableCell>
                                <TableCell className="align-top text-left break-words">
                                    {record.filePemeriksaanUrl ? (
                                        <Button asChild variant="outline" size="sm">
                                            <a href={record.filePemeriksaanUrl} target="_blank" rel="noopener noreferrer">
                                                <LinkIcon className="mr-2 h-4 w-4" />
                                                Open File
                                            </a>
                                        </Button>
                                    ) : (
                                        <span className='text-muted-foreground'>No file</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right align-top">
                                    <EditPemeriksaanRecordDialog record={record} onRecordUpdate={onUpdate} />
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
                            This will permanently delete the record for registration <span className="font-semibold">{recordToDelete?.registrasi}</span>.
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

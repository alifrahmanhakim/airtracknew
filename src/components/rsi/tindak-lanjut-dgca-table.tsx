

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
import type { TindakLanjutDgcaRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Info, ArrowUpDown, Link as LinkIcon } from 'lucide-react';
import { Highlight } from '../ui/highlight';
import { EditTindakLanjutDgcaDialog } from './edit-tindak-lanjut-dgca-dialog';
import { format, parseISO } from 'date-fns';

type SortDescriptor = {
  column: keyof TindakLanjutDgcaRecord;
  direction: 'asc' | 'desc';
} | null;

type TindakLanjutDgcaTableProps = {
  records: TindakLanjutDgcaRecord[];
  onUpdate: (record: TindakLanjutDgcaRecord) => void;
  onDelete: (record: TindakLanjutDgcaRecord) => void;
  searchTerm: string;
  sort: SortDescriptor;
  setSort: (sort: SortDescriptor) => void;
};

const BulletList = ({ text, searchTerm }: { text: string; searchTerm: string }) => {
    if (!text) return null;
    return <p className="whitespace-pre-wrap"><Highlight text={text} query={searchTerm} /></p>;
};

export function TindakLanjutDgcaTable({ records, onUpdate, onDelete, searchTerm, sort, setSort }: TindakLanjutDgcaTableProps) {
    if (records.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
                <Info className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">No records found for the current filters.</p>
                <p className="text-sm">Try adjusting your search or filter criteria.</p>
            </div>
        )
    }
    
    const handleSort = (column: keyof TindakLanjutDgcaRecord) => {
        setSort(prevSort => {
            if (prevSort?.column === column) {
                return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { column, direction: 'asc' };
        });
    };

    const renderSortIcon = (column: keyof TindakLanjutDgcaRecord) => {
        if (sort?.column !== column) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
        return sort.direction === 'asc' ? <ArrowUpDown className="h-4 w-4 ml-2" /> : <ArrowUpDown className="h-4 w-4 ml-2" />;
    };

    return (
        <div className="border rounded-md w-full overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">No</TableHead>
                        <TableHead className="min-w-[250px] cursor-pointer" onClick={() => handleSort('tanggalKejadian')}>
                            <div className="flex items-center">
                                Laporan Investigasi KNKT
                                {renderSortIcon('tanggalKejadian')}
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[200px]">Rekomendasi Keselamatan Ke DGCA</TableHead>
                        <TableHead className="min-w-[200px]">Nomor Rekomendasi Keselamatan</TableHead>
                        <TableHead className="min-w-[300px]">Tindak lanjut DKPPU</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map((record, index) => (
                        <TableRow key={record.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="align-top">
                                <p className="font-bold"><Highlight text={record.judulLaporan} query={searchTerm} /></p>
                                <p><Highlight text={record.nomorLaporan} query={searchTerm} /></p>
                                <p className="text-sm text-muted-foreground">Operator: <Highlight text={record.operator} query={searchTerm} /></p>
                                <p className="text-sm text-muted-foreground">Tipe Pesawat: <Highlight text={record.tipePesawat} query={searchTerm} /></p>
                                <p className="text-sm text-muted-foreground">Registrasi: <Highlight text={record.registrasi} query={searchTerm} /></p>
                                <p className="text-sm text-muted-foreground">Lokasi: <Highlight text={record.lokasi} query={searchTerm} /></p>
                                <p className="text-sm text-muted-foreground">Kejadian: <Highlight text={format(parseISO(record.tanggalKejadian), 'dd MMM yyyy')} query={searchTerm} /></p>
                                <p className="text-sm text-muted-foreground">Terbit: <Highlight text={record.tanggalTerbit ? format(parseISO(record.tanggalTerbit), 'dd MMM yyyy') : 'N/A'} query={searchTerm} /></p>
                            </TableCell>
                            <TableCell className="align-top"><BulletList text={record.rekomendasiKeDgca} searchTerm={searchTerm} /></TableCell>
                            <TableCell className="align-top"><BulletList text={record.nomorRekomendasi} searchTerm={searchTerm} /></TableCell>
                            <TableCell className="align-top"><BulletList text={record.tindakLanjutDkppu} searchTerm={searchTerm} /></TableCell>
                            <TableCell className="align-top">
                                {record.fileUrl ? (
                                    <Button asChild variant="ghost" size="icon">
                                        <a href={record.fileUrl} target="_blank" rel="noopener noreferrer">
                                            <LinkIcon className="h-4 w-4" />
                                        </a>
                                    </Button>
                                ) : (
                                    <span className="text-xs text-muted-foreground">None</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right align-top">
                                <EditTindakLanjutDgcaDialog record={record} onRecordUpdate={onUpdate} />
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(record)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

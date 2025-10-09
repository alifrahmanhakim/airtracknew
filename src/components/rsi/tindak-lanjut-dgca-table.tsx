
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
import { Pencil, Trash2, Info } from 'lucide-react';
import { Highlight } from '../ui/highlight';
import { EditTindakLanjutDgcaDialog } from './edit-tindak-lanjut-dgca-dialog';
import { format, parseISO } from 'date-fns';

type TindakLanjutDgcaTableProps = {
  records: TindakLanjutDgcaRecord[];
  onUpdate: (record: TindakLanjutDgcaRecord) => void;
  onDelete: (record: TindakLanjutDgcaRecord) => void;
  searchTerm: string;
};

const BulletList = ({ text, searchTerm }: { text: string; searchTerm: string }) => {
    if (!text) return null;
    return <p className="whitespace-pre-wrap"><Highlight text={text} query={searchTerm} /></p>;
};

export function TindakLanjutDgcaTable({ records, onUpdate, onDelete, searchTerm }: TindakLanjutDgcaTableProps) {
    if (records.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
                <Info className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">No records found for the current filters.</p>
                <p className="text-sm">Try adjusting your search or filter criteria.</p>
            </div>
        )
    }

    return (
        <div className="border rounded-md overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">No</TableHead>
                        <TableHead className="min-w-[250px]">Laporan Investigasi KNKT</TableHead>
                        <TableHead className="min-w-[200px]">Rekomendasi Keselamatan Ke DGCA</TableHead>
                        <TableHead className="min-w-[200px]">Nomor Rekomendasi Keselamatan</TableHead>
                        <TableHead className="min-w-[300px]">Tindak lanjut DKPPU</TableHead>
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
                                <p className="text-sm text-muted-foreground">Kejadian: <Highlight text={format(parseISO(record.tanggalKejadian), 'dd MMM yyyy')} query={searchTerm} /></p>
                                <p className="text-sm text-muted-foreground">Terbit: <Highlight text={record.tanggalTerbit ? format(parseISO(record.tanggalTerbit), 'dd MMM yyyy') : 'N/A'} query={searchTerm} /></p>
                            </TableCell>
                            <TableCell className="align-top"><BulletList text={record.rekomendasiKeDgca} searchTerm={searchTerm} /></TableCell>
                            <TableCell className="align-top"><BulletList text={record.nomorRekomendasi} searchTerm={searchTerm} /></TableCell>
                            <TableCell className="align-top"><BulletList text={record.tindakLanjutDkppu} searchTerm={searchTerm} /></TableCell>
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



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
import type { TindakLanjutRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Info } from 'lucide-react';
import { Highlight } from '../ui/highlight';

type TindakLanjutTableProps = {
  records: TindakLanjutRecord[];
  onUpdate: (record: TindakLanjutRecord) => void;
  onDelete: (record: TindakLanjutRecord) => void;
  searchTerm: string;
};

const BulletList = ({ text, searchTerm }: { text: string; searchTerm: string }) => {
    if (!text) return null;
    const items = text.split(/\s*(?:[a-z]\.|[0-9]\.)\s*/).filter(item => item.trim() !== '');
    if (items.length <= 1 && !/^[a-z0-9]\./i.test(text.trim())) return <p className="whitespace-pre-wrap"><Highlight text={text} query={searchTerm} /></p>;
    
    return (
      <ul className="list-disc list-inside space-y-1">
        {items.map((item, index) => (
          <li key={index}><Highlight text={item.trim()} query={searchTerm} /></li>
        ))}
      </ul>
    );
};

export function TindakLanjutTable({ records, onUpdate, onDelete, searchTerm }: TindakLanjutTableProps) {
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
                        <TableHead className="min-w-[250px]">Laporan KNKT</TableHead>
                        <TableHead className="min-w-[200px]">Penerima Rekomendasi</TableHead>
                        <TableHead className="min-w-[300px]">Rekomendasi Keselamatan</TableHead>
                        <TableHead className="min-w-[300px]">Tindak Lanjut/Respon DKPPU</TableHead>
                        <TableHead className="min-w-[300px]">Tindak Lanjut Operator/Pihak Terkait</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map((record, index) => (
                        <TableRow key={record.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="align-top"><BulletList text={record.laporanKnkt} searchTerm={searchTerm} /></TableCell>
                            <TableCell className="align-top"><Highlight text={record.penerimaRekomendasi} query={searchTerm} /></TableCell>
                            <TableCell className="align-top">
                                {record.rekomendasi.map(rec => (
                                    <div key={rec.id} className="mb-2 last:mb-0">
                                        <p className="font-semibold"><Highlight text={rec.nomor} query={searchTerm} /></p>
                                        <p><Highlight text={rec.deskripsi} query={searchTerm} /></p>
                                    </div>
                                ))}
                            </TableCell>
                            <TableCell className="align-top"><BulletList text={record.tindakLanjutDkppu} searchTerm={searchTerm} /></TableCell>
                            <TableCell className="align-top"><BulletList text={record.tindakLanjutOperator} searchTerm={searchTerm} /></TableCell>
                            <TableCell className="text-right align-top">
                                <Button variant="ghost" size="icon" onClick={() => { /* onUpdate logic */ }}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
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



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
import { Pencil, Trash2, Info, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Highlight } from '../ui/highlight';
import { format, parseISO } from 'date-fns';
import { EditTindakLanjutRecordDialog } from './edit-tindak-lanjut-dialog';
import { cn } from '@/lib/utils';

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
        <div className="border rounded-md w-full overflow-x-auto">
            <Table className="table-fixed">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[5%]">No</TableHead>
                        <TableHead className="w-[20%]">Laporan KNKT & Info Pesawat</TableHead>
                        <TableHead className="w-[15%]">Penerima Rekomendasi</TableHead>
                        <TableHead className="w-[20%]">Rekomendasi Keselamatan</TableHead>
                        <TableHead className="w-[15%]">Tindak Lanjut/Respon DKPPU</TableHead>
                        <TableHead className="w-[15%]">Tindak Lanjut Operator/Pihak Terkait</TableHead>
                        <TableHead className="w-[10%]">Status</TableHead>
                        <TableHead className="w-[5%]">File</TableHead>
                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map((record, index) => {
                        const penerimaList = Array.isArray(record.penerimaRekomendasi)
                            ? record.penerimaRekomendasi
                            : (typeof record.penerimaRekomendasi === 'string' && record.penerimaRekomendasi ? [record.penerimaRekomendasi] : []);

                        return (
                            <TableRow key={record.id}>
                                <TableCell className="align-top break-words">{index + 1}</TableCell>
                                <TableCell className="align-top break-words">
                                    <p className="font-bold"><Highlight text={record.judulLaporan} query={searchTerm} /></p>
                                    <p><Highlight text={record.nomorLaporan} query={searchTerm} /></p>
                                    <p className="text-sm text-muted-foreground">Kejadian: <Highlight text={record.tanggalKejadian ? format(parseISO(record.tanggalKejadian), 'dd MMM yyyy') : 'N/A'} query={searchTerm} /></p>
                                    {record.tanggalTerbit && <p className="text-sm text-muted-foreground">Terbit: <Highlight text={format(parseISO(record.tanggalTerbit), 'dd MMM yyyy')} query={searchTerm} /></p>}
                                    {record.registrasiPesawat && <p className="text-sm text-muted-foreground">Registrasi: <Highlight text={record.registrasiPesawat} query={searchTerm} /></p>}
                                    {record.tipePesawat && <p className="text-sm text-muted-foreground">Tipe: <Highlight text={record.tipePesawat} query={searchTerm} /></p>}
                                    {record.lokasiKejadian && <p className="text-sm text-muted-foreground">Lokasi: <Highlight text={record.lokasiKejadian} query={searchTerm} /></p>}
                                </TableCell>
                                <TableCell className="align-top break-words">
                                    <div className="flex flex-wrap gap-1">
                                        {penerimaList.map((penerima, i) => (
                                            <Badge key={i} variant="secondary">
                                                <Highlight text={penerima} query={searchTerm} />
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="align-top break-words">
                                    {record.rekomendasi.map(rec => (
                                        <div key={rec.id} className="mb-2 last:mb-0">
                                            <p className="font-semibold"><Highlight text={rec.nomor} query={searchTerm} /></p>
                                            <p><Highlight text={rec.deskripsi} query={searchTerm} /></p>
                                        </div>
                                    ))}
                                </TableCell>
                                <TableCell className="align-top break-words"><BulletList text={record.tindakLanjutDkppu || ''} searchTerm={searchTerm} /></TableCell>
                                <TableCell className="align-top break-words"><BulletList text={record.tindakLanjutOperator || ''} searchTerm={searchTerm} /></TableCell>
                                <TableCell className="align-top break-words">
                                    <Badge
                                        className={cn({
                                            'bg-green-100 text-green-800 hover:bg-green-200': record.status === 'Final',
                                            'bg-yellow-100 text-yellow-800 hover:bg-yellow-200': record.status === 'Draft' || record.status === 'Draft Final',
                                            'bg-blue-100 text-blue-800 hover:bg-blue-200': record.status === 'Preliminary',
                                            'bg-gray-100 text-gray-800 hover:bg-gray-200': record.status === 'Interim Statement',
                                        })}
                                    >
                                        {record.status || 'N/A'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="align-top break-words">
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
                                    <EditTindakLanjutRecordDialog record={record} onRecordUpdate={onUpdate} />
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(record)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

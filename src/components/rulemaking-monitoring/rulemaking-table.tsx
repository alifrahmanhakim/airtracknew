'use client';

import * as React from 'react';
import type { RulemakingRecord, Stage } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Info } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { format, parseISO } from 'date-fns';
import { EditRulemakingRecordDialog } from './edit-rulemaking-record-dialog';

type RulemakingTableProps = {
  records: RulemakingRecord[];
  onDelete: (record: RulemakingRecord) => void;
  isLoading: boolean;
  onUpdate: (record: RulemakingRecord) => void;
};

const BulletList = ({ text }: { text: string }) => {
    if (!text) return null;
    // Split by two or more newlines, which can be followed by whitespace.
    const items = text.split(/\n\s*\n/).filter(item => item.trim() !== '');
    if (items.length <= 1 && !text.includes('\n\n')) {
        return <p className="whitespace-pre-wrap">{text}</p>;
    }
    
    return (
      <ul className="list-disc list-inside space-y-1">
        {items.map((item, index) => (
          <li key={index}>{item.trim()}</li>
        ))}
      </ul>
    );
};

export function RulemakingTable({ records, onDelete, isLoading, onUpdate }: RulemakingTableProps) {
  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }
  
  if (records.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No Records Found</p>
        <p className="text-sm">Use the form to add a new rulemaking record.</p>
      </div>
    );
  }

  const renderStage = (stage: Stage, index: number) => (
    <div key={`${stage.pengajuan?.nomor}-${index}`} className="border-b last:border-b-0 py-2">
       <div className="font-semibold mb-1">
          {stage.pengajuan.tanggal && (
            <Badge variant="secondary">{format(parseISO(stage.pengajuan.tanggal), 'dd MMM yyyy')}</Badge>
          )}
          {stage.pengajuan.nomor && <p className="text-sm mt-1">{stage.pengajuan.nomor}</p>}
          {stage.pengajuan.keteranganPengajuan && <p className="text-sm mt-1 text-muted-foreground">{stage.pengajuan.keteranganPengajuan}</p>}
      </div>
      <div className="text-sm mt-2">
        <strong className="text-muted-foreground">Status:</strong>
        <div className="pl-2">
          <BulletList text={stage.status.deskripsi} />
        </div>
      </div>
      {stage.keterangan?.text && (
        <div className="text-sm mt-1">
            <strong className="text-muted-foreground">Keterangan:</strong>
            <div className="pl-2">
                <BulletList text={stage.keterangan.text} />
            </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[5%]">No</TableHead>
            <TableHead className="w-[20%]">Perihal</TableHead>
            <TableHead className="w-[15%]">Kategori</TableHead>
            <TableHead className="w-[50%]">Pengajuan</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => (
            <TableRow key={record.id}>
              <TableCell className="align-top">{index + 1}</TableCell>
              <TableCell className="align-top font-medium">{record.perihal}</TableCell>
              <TableCell className="align-top">
                <Badge variant="outline">{record.kategori}</Badge>
              </TableCell>
              <TableCell className="align-top">
                <div className="space-y-2">
                  {(record.stages || []).map((stage, i) => renderStage(stage, i))}
                </div>
              </TableCell>
              <TableCell className="text-right align-top">
                <div className="flex justify-end gap-1">
                  <EditRulemakingRecordDialog record={record} onRecordUpdate={onUpdate} />
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(record)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


'use client';

import * as React from 'react';
import type { RulemakingRecord } from '@/lib/types';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RulemakingForm } from './rulemaking-form';

type RulemakingTableProps = {
  records: RulemakingRecord[];
  onDelete: (record: RulemakingRecord) => void;
  onUpdate: (record: RulemakingRecord) => void;
  isLoading: boolean;
};

function EditRecordDialog({ record, onUpdate }: { record: RulemakingRecord, onUpdate: (record: RulemakingRecord) => void }) {
    const [open, setOpen] = React.useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Record</DialogTitle>
                    <DialogDescription>
                        Update the details for "{record.perihal.substring(0, 50)}...".
                    </DialogDescription>
                </DialogHeader>
                <RulemakingForm record={record} onFormSubmit={() => { onUpdate(record); setOpen(false); }} />
            </DialogContent>
        </Dialog>
    );
}

export function RulemakingTable({ records, onDelete, onUpdate, isLoading }: RulemakingTableProps) {
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

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[5%]">No</TableHead>
            <TableHead className="w-[20%]">Perihal</TableHead>
            <TableHead className="w-[20%]">Pengajuan</TableHead>
            <TableHead className="w-[30%]">Status</TableHead>
            <TableHead className="w-[15%]">Keterangan</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => (
            <TableRow key={record.id}>
              <TableCell className="align-top">{index + 1}</TableCell>
              <TableCell className="align-top font-medium">{record.perihal}</TableCell>
              <TableCell className="align-top">
                <p><strong>Tanggal:</strong> {record.pengajuan.tanggal}</p>
                <p><strong>Nomor:</strong> {record.pengajuan.nomor}</p>
              </TableCell>
              <TableCell className="align-top">
                <p>{record.status.deskripsi}</p>
                {record.status.nomorSurat && <p className="text-sm text-muted-foreground">No. Surat: {record.status.nomorSurat}</p>}
                {record.status.tanggalSurat && <p className="text-sm text-muted-foreground">Tgl. Surat: {record.status.tanggalSurat}</p>}
              </TableCell>
              <TableCell className="align-top">{record.keterangan || '-'}</TableCell>
              <TableCell className="text-right align-top">
                <div className="flex justify-end gap-1">
                  <EditRecordDialog record={record} onUpdate={onUpdate} />
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

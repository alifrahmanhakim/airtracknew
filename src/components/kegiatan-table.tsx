
'use client';

import * as React from 'react';
import type { Kegiatan, User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from './ui/button';
import { Info, Pencil, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { KegiatanForm } from './kegiatan-form';
import { Skeleton } from './ui/skeleton';

type KegiatanTableProps = {
  records: Kegiatan[];
  onDelete: (record: Kegiatan) => void;
  onUpdate: (record: Kegiatan) => void;
  isLoading: boolean;
  users: User[];
};

function EditKegiatanDialog({ record, onUpdate, users }: { record: Kegiatan; onUpdate: (record: Kegiatan) => void; users: User[] }) {
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
                    <DialogTitle>Edit Kegiatan</DialogTitle>
                    <DialogDescription>
                        Perbarui detail kegiatan "{record.subjek}".
                    </DialogDescription>
                </DialogHeader>
                <KegiatanForm 
                    kegiatan={record}
                    onFormSubmit={(updatedRecord) => {
                        onUpdate(updatedRecord);
                        setOpen(false);
                    }}
                    users={users}
                />
            </DialogContent>
        </Dialog>
    );
}


export function KegiatanTable({ records, onDelete, onUpdate, isLoading, users }: KegiatanTableProps) {

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }
  
  if (records.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No Activities Found</p>
        <p className="text-sm">There are no activities for the selected week.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[25%]">Subjek</TableHead>
            <TableHead className="w-[20%]">Tanggal</TableHead>
            <TableHead className="w-[20%]">Nama yang Terlibat</TableHead>
            <TableHead className="w-[15%]">Lokasi</TableHead>
            <TableHead className="w-[20%]">Catatan</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium align-top">{record.subjek}</TableCell>
              <TableCell className="align-top">
                {format(parseISO(record.tanggalMulai), 'dd MMM yyyy')} - {format(parseISO(record.tanggalSelesai), 'dd MMM yyyy')}
              </TableCell>
              <TableCell className="align-top">
                <div className="flex flex-wrap gap-1">
                    {record.nama.map((nama, i) => <Badge key={i} variant="secondary">{nama}</Badge>)}
                </div>
              </TableCell>
              <TableCell className="align-top">{record.lokasi}</TableCell>
              <TableCell className="align-top whitespace-pre-wrap">{record.catatan || '-'}</TableCell>
              <TableCell className="text-right align-top">
                <div className="flex justify-end gap-1">
                    <EditKegiatanDialog record={record} onUpdate={onUpdate} users={users} />
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

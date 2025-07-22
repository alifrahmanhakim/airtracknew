
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { GlossaryRecord } from '@/lib/types';
import { Badge } from './ui/badge';
import { format, parseISO } from 'date-fns';

type DetailRowProps = {
  label: string;
  value?: string | React.ReactNode;
  isLongText?: boolean;
};

const DetailRow = ({ label, value, isLongText = false }: DetailRowProps) => {
  if (!value && typeof value !== 'string') return null;
  return (
    <div className={`grid grid-cols-1 ${isLongText ? '' : 'sm:grid-cols-3'} gap-1 sm:gap-4 py-3 border-b`}>
      <dt className="font-semibold text-muted-foreground">{label}</dt>
      <dd className="sm:col-span-2 text-sm whitespace-pre-wrap">{value}</dd>
    </div>
  );
};

type GlossaryRecordDetailDialogProps = {
  record: GlossaryRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GlossaryRecordDetailDialog({ record, open, onOpenChange }: GlossaryRecordDetailDialogProps) {
  if (!record) return null;

  const getFormattedDate = (dateString: string | Date): string => {
    if (!dateString) return 'N/A';
    try {
      if (typeof dateString === 'string') {
        return format(parseISO(dateString), 'PPP p');
      }
      if (dateString instanceof Date) {
        return format(dateString, 'PPP p');
      }
      // Firestore Timestamp object might be passed in some cases
      if (typeof dateString === 'object' && 'toDate' in dateString) {
        return format((dateString as any).toDate(), 'PPP p');
      }
    } catch (e) {
      console.error("Date formatting failed", e);
      return 'Invalid Date';
    }
    return 'Invalid Date';
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Glossary Record Details</DialogTitle>
          <DialogDescription>
            Full details for TSU: <span className="font-semibold truncate">{record.tsu}</span>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
            <dl className="divide-y divide-border">
                <DetailRow label="TSU (Teks Sumber)" value={record.tsu} isLongText />
                <DetailRow label="TSA (Teks Sasaran)" value={record.tsa} isLongText />
                <DetailRow label="Editing (Teks yang sudah disunting)" value={record.editing} isLongText />
                <DetailRow label="Makna" value={record.makna} isLongText />
                <DetailRow label="Keterangan / Pengaplikasian" value={record.keterangan} isLongText />
                <DetailRow label="Referensi / Daftar Pustaka" value={record.referensi} isLongText />
                <DetailRow label="Status" value={<Badge>{record.status}</Badge>} />
                <DetailRow label="Created At" value={getFormattedDate(record.createdAt)} />
            </dl>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

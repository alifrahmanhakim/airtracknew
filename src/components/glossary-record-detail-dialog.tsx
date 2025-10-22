
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
import { format, parseISO, isValid } from 'date-fns';
import { Separator } from './ui/separator';

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

  const getFormattedDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
        const date = parseISO(dateString);
        if (isValid(date)) {
            return format(date, 'PPP p');
        }
        return 'Invalid Date';
    } catch {
        return 'Invalid Date';
    }
  }

  const statusHistory = record.statusHistory || [];
  // Sort history chronologically, oldest first
  statusHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


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
                <DetailRow label="Current Status" value={<Badge>{record.status}</Badge>} />
                <DetailRow label="Created At" value={getFormattedDate(record.createdAt)} />
                <DetailRow label="Last Updated" value={getFormattedDate(record.updatedAt)} />
                
                <div className="py-3">
                    <dt className="font-semibold text-muted-foreground">Status History</dt>
                    <dd className="sm:col-span-2 text-sm mt-2">
                        {statusHistory.length > 0 ? (
                            <ul className="space-y-2">
                                {statusHistory.map((historyItem, index) => (
                                    <li key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                        <Badge>{historyItem.status}</Badge>
                                        <span className="flex-grow border-b border-dashed"></span>
                                        <span className="text-muted-foreground">{getFormattedDate(historyItem.date)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground">No status history available.</p>
                        )}
                    </dd>
                </div>
            </dl>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

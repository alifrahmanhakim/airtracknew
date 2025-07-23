

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PqRecord } from '@/lib/types';
import { Badge } from './ui/badge';
import { format, parseISO, isValid } from 'date-fns';

type DetailRowProps = {
  label: string;
  value?: string | React.ReactNode;
  isLongText?: boolean;
};

const DetailRow = ({ label, value, isLongText = false }: DetailRowProps) => {
  if (!value) return null;
  return (
    <div className={`grid grid-cols-1 ${isLongText ? '' : 'sm:grid-cols-3'} gap-1 sm:gap-4 py-3 border-b`}>
      <dt className="font-semibold text-muted-foreground">{label}</dt>
      <dd className="sm:col-span-2 text-sm">{value}</dd>
    </div>
  );
};

type PqRecordDetailDialogProps = {
  record: PqRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PqRecordDetailDialog({ record, open, onOpenChange }: PqRecordDetailDialogProps) {
  if (!record) return null;

  const getFormattedDate = (dateString: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Protocol Question (PQ) Record Details</DialogTitle>
          <DialogDescription>
            Full details for PQ Number: <span className="font-semibold">{record.pqNumber}</span>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
            <dl className="divide-y divide-border">
                <DetailRow label="PQ Number" value={record.pqNumber} />
                <DetailRow label="Protocol Question" value={record.protocolQuestion} isLongText />
                <DetailRow label="Guidance for Review of Evidence" value={record.guidance} isLongText />
                <DetailRow label="ICAO References" value={record.icaoReferences} isLongText />
                <DetailRow label="PPQ" value={<Badge variant={record.ppq === 'YES' ? 'destructive' : 'secondary'}>{record.ppq}</Badge>} />
                <DetailRow label="Critical Element" value={record.criticalElement} />
                <DetailRow label="Remarks" value={record.remarks} isLongText />
                <DetailRow label="Evidence" value={record.evidence} isLongText />
                <DetailRow label="Answer" value={record.answer} isLongText />
                <DetailRow label="POC" value={record.poc} isLongText />
                <DetailRow label="ICAO Status Implementation" value={record.icaoStatus} />
                <DetailRow label="CAP" value={record.cap} isLongText />
                <DetailRow label="SSP Component" value={record.sspComponent} isLongText />
                <DetailRow label="Status" value={<Badge>{record.status}</Badge>} />
                <DetailRow label="Created At" value={getFormattedDate(record.createdAt)} />
            </dl>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

    

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CcefodRecord } from '@/lib/types';
import { Badge } from './ui/badge';
import { format, parseISO } from 'date-fns';
import { Separator } from './ui/separator';

type DetailRowProps = {
  label: string;
  value?: string | React.ReactNode;
  isLongText?: boolean;
  isHtml?: boolean;
};

const DetailRow = ({ label, value, isLongText = false, isHtml = false }: DetailRowProps) => {
  if (!value) return null;
  return (
    <div className={`grid grid-cols-1 ${isLongText ? '' : 'sm:grid-cols-3'} gap-1 sm:gap-4 py-3 border-b`}>
      <dt className="font-semibold text-muted-foreground">{label}</dt>
      {isHtml ? (
        <dd className="sm:col-span-2 text-sm prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: value as string }} />
      ) : (
        <dd className="sm:col-span-2 text-sm">{value}</dd>
      )}
    </div>
  );
};

type CcefodRecordDetailDialogProps = {
  record: CcefodRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CcefodRecordDetailDialog({ record, open, onOpenChange }: CcefodRecordDetailDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>CC/EFOD Record Details</DialogTitle>
          <DialogDescription>
            Full details for Annex Reference: <span className="font-semibold">{record.annexReference}</span>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
            <dl className="divide-y divide-border">
                <DetailRow label="Annex" value={record.annex} />
                <DetailRow label="Annex Reference" value={record.annexReference} />
                <DetailRow label="Standard or Recommended Practice" value={record.standardPractice} isLongText isHtml />
                <DetailRow label="State Legislation, Regulation or Document Reference" value={record.legislationReference} />
                <DetailRow label="Level of Implementation of SARP's" value={record.implementationLevel} />
                
                <Separator className="my-4" />

                <h3 className="text-lg font-semibold mt-6 mb-2">Usulan Perubahan</h3>
                <DetailRow label="Apakah ada perubahan?" value={<Badge variant={record.adaPerubahan === 'YA' ? 'destructive' : 'secondary'}>{record.adaPerubahan}</Badge>} />
                {record.adaPerubahan === 'YA' && (
                    <>
                        <DetailRow label="Usulan perubahan" value={record.usulanPerubahan} />
                        <DetailRow label="Isi Usulan" value={record.isiUsulan} isLongText />
                    </>
                )}

                <Separator className="my-4" />

                <h3 className="text-lg font-semibold mt-6 mb-2">Details & Status</h3>
                <DetailRow label="Text of Difference to be Notified to ICAO" value={record.differenceText} isLongText />
                <DetailRow label="Comments Including the Reason for the Difference" value={record.differenceReason} isLongText />
                <DetailRow label="Remarks" value={record.remarks} isLongText />
                <DetailRow label="Status" value={<Badge>{record.status}</Badge>} />
                <DetailRow label="Created At" value={format(parseISO(record.createdAt), 'PPP p')} />
            </dl>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

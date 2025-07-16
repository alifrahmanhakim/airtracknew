

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { EvaluationItem, GapAnalysisRecord } from '@/lib/types';
import { Badge } from './ui/badge';
import { format, parseISO } from 'date-fns';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { User } from 'lucide-react';
import Image from 'next/image';

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

const EvaluationCard = ({ evaluation }: { evaluation: EvaluationItem }) => (
    <Card className="bg-muted/50">
        <CardHeader>
            <CardTitle className="text-base">ICAO SARP</CardTitle>
            <p className="text-sm font-normal">{evaluation.icaoSarp}</p>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <h4 className="font-semibold text-sm mb-1">Review</h4>
                <p className="text-sm text-muted-foreground">{evaluation.review}</p>
            </div>
             <div>
                <h4 className="font-semibold text-sm mb-1">Compliance Status</h4>
                <p className="text-sm text-muted-foreground">{evaluation.complianceStatus}</p>
            </div>
             <div>
                <h4 className="font-semibold text-sm mb-1">CASR Affected</h4>
                <p className="text-sm text-muted-foreground">{evaluation.casrAffected}</p>
            </div>
        </CardContent>
    </Card>
)

type GapAnalysisRecordDetailDialogProps = {
  record: GapAnalysisRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GapAnalysisRecordDetailDialog({ record, open, onOpenChange }: GapAnalysisRecordDetailDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>GAP Analysis Record Details</DialogTitle>
          <DialogDescription>
            Full details for SL Ref Number: <span className="font-semibold">{record.slReferenceNumber}</span>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
            <dl className="divide-y divide-border">
                <DetailRow label="SL Reference Number" value={record.slReferenceNumber} />
                <DetailRow label="Annex" value={record.annex} />
                <DetailRow label="Type of State Letter" value={record.typeOfStateLetter} />
                <DetailRow label="Date of Evaluation" value={format(parseISO(record.dateOfEvaluation), 'PPP')} />
                <DetailRow label="Subject" value={record.subject} isLongText />
                <DetailRow label="Action Required" value={record.actionRequired} isLongText />
                <DetailRow label="Effective Date" value={format(parseISO(record.effectiveDate), 'PPP')} />
                <DetailRow label="Applicability Date" value={format(parseISO(record.applicabilityDate), 'PPP')} />
                <DetailRow label="Embedded Applicability Date" value={format(parseISO(record.embeddedApplicabilityDate), 'PPP')} />
                
                <Separator className="my-4" />
                
                <h3 className="text-lg font-semibold mt-6 mb-2">Evaluations</h3>
                <div className="space-y-4">
                    {record.evaluations.map(evalItem => <EvaluationCard key={evalItem.id} evaluation={evalItem} />)}
                </div>

                <Separator className="my-4" />

                <h3 className="text-lg font-semibold mt-6 mb-2">Follow Up</h3>
                <DetailRow label="Status Item" value={<Badge variant={record.statusItem === 'CLOSED' ? 'default' : 'destructive'}>{record.statusItem}</Badge>} />
                <DetailRow label="Summary" value={record.summary} isLongText />
                
                <div className="py-3 border-b">
                    <dt className="font-semibold text-muted-foreground mb-2 flex items-center gap-2"><User className="h-4 w-4" /> Inspectors</dt>
                    <dd className="space-y-4">
                        {record.inspectors?.map((inspector) => (
                        <div key={inspector.id} className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-4 border p-3 rounded-md">
                            <p><span className="font-medium">Name:</span> {inspector.name}</p>
                            <div>
                                <p className="font-medium mb-1">Signature:</p>
                                {inspector.signature ? (
                                    <div className="bg-white p-2 border rounded-md max-w-[200px]">
                                        <Image src={inspector.signature} alt={`Signature of ${inspector.name}`} width={200} height={100} className="w-full h-auto" />
                                    </div>
                                ) : (
                                    <span>N/A</span>
                                )}
                            </div>
                        </div>
                        ))}
                    </dd>
                </div>
                
                <DetailRow label="Created At" value={format(parseISO(record.createdAt), 'PPP p')} />
            </dl>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

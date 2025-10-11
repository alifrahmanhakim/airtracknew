

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { EvaluationItem, GapAnalysisRecord, ActionRequiredItem, ImplementationTaskItem, Verifier } from '@/lib/types';
import { Badge } from './ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { User, ListChecks } from 'lucide-react';
import Image from 'next/image';
import { Checkbox } from './ui/checkbox';

type DetailRowProps = {
  label: string;
  value?: string | React.ReactNode;
  isLongText?: boolean;
};

const DetailRow = ({ label, value, isLongText = false }: DetailRowProps) => {
  if (!value && typeof value !== 'number') return null;
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
                <h4 className="font-semibold text-sm mb-1">Follow Up</h4>
                <p className="text-sm text-muted-foreground">{evaluation.followUp || '-'}</p>
            </div>
             <div>
                <h4 className="font-semibold text-sm mb-1">Proposed Amendment</h4>
                <p className="text-sm text-muted-foreground">{evaluation.proposedAmendment || '-'}</p>
            </div>
             <div>
                <h4 className="font-semibold text-sm mb-1">Reason/Remark</h4>
                <p className="text-sm text-muted-foreground">{evaluation.reasonOrRemark || '-'}</p>
            </div>
            <div>
                <h4 className="font-semibold text-sm mb-1">Status Item</h4>
                <Badge variant={evaluation.status === 'CLOSED' ? 'default' : 'destructive'}>
                    {evaluation.status || 'N/A'}
                </Badge>
            </div>
             <div>
                <h4 className="font-semibold text-sm mb-1">CASR Affected</h4>
                <p className="text-sm text-muted-foreground">{evaluation.casrAffected}</p>
            </div>
            <div>
                <h4 className="font-semibold text-sm mb-1">Compliance Status</h4>
                <p className="text-sm text-muted-foreground">{evaluation.complianceStatus}</p>
            </div>
        </CardContent>
    </Card>
)

const actionRequiredLabels: Record<ActionRequiredItem['id'], string> = {
    disapproval: 'Notify any disapproval before',
    differences: 'Notify any differences and compliance before',
    efod: 'Consider the use of the Electronic Filing of Differences (EFOD) System for notification of differences and compliance',
};


type GapAnalysisRecordDetailDialogProps = {
  record: GapAnalysisRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GapAnalysisRecordDetailDialog({ record, open, onOpenChange }: GapAnalysisRecordDetailDialogProps) {
  if (!record) return null;

  const actionRequiredContent = (
    <div className="space-y-2">
      {(record.actionRequired || []).map((item) => (
          <div key={item.id} className="flex items-start gap-3">
              <Checkbox checked={item.checked} className="mt-1 pointer-events-none" />
              <div>
                  <label className="font-normal">{actionRequiredLabels[item.id]}</label>
                  {item.checked && item.date && (
                    <p className="text-xs text-muted-foreground">
                        Date: {format(parseISO(item.date), 'PPP')}
                    </p>
                  )}
              </div>
          </div>
      ))}
    </div>
  );
  
  const getFormattedDate = (dateValue: string | Date | { toDate: () => Date } | undefined): string => {
    if (!dateValue) return 'N/A';
    try {
      if (typeof dateValue === 'string') {
        const parsedDate = parseISO(dateValue);
        if (isValid(parsedDate)) {
          return format(parsedDate, 'PPP p');
        }
      }
      if (dateValue instanceof Date) {
        return format(dateValue, 'PPP p');
      }
      if (typeof dateValue === 'object' && 'toDate' in dateValue && typeof dateValue.toDate === 'function') {
        return format(dateValue.toDate(), 'PPP p');
      }
    } catch (e) {
      console.error('Date formatting failed:', e);
      return 'Invalid Date';
    }
    return String(dateValue);
  };


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
                <DetailRow label="SL Reference Date" value={record.slReferenceDate ? format(parseISO(record.slReferenceDate), 'PPP') : 'N/A'} />
                <DetailRow label="Annex" value={record.annex} />
                <DetailRow label="Type of State Letter" value={record.typeOfStateLetter} />
                <DetailRow label="Date of Evaluation" value={record.dateOfEvaluation ? format(parseISO(record.dateOfEvaluation), 'PPP') : 'N/A'} />
                <DetailRow label="Subject" value={record.subject} isLongText />
                <DetailRow label="Nama Surat" value={record.letterName} />
                <DetailRow label="Perihal Surat" value={record.letterSubject} isLongText />
                <DetailRow label="Tanggal Pelaksanaan" value={record.implementationDate ? format(parseISO(record.implementationDate), 'PPP') : 'N/A'} />
                <DetailRow label="Action Required" value={actionRequiredContent} isLongText />
                <DetailRow label="Effective Date" value={record.effectiveDate ? format(parseISO(record.effectiveDate), 'PPP') : 'N/A'} />
                <DetailRow label="Applicability Date" value={record.applicabilityDate ? format(parseISO(record.applicabilityDate), 'PPP') : 'N/A'} />
                <DetailRow label="Embedded Applicability Date" value={record.embeddedApplicabilityDate ? format(parseISO(record.embeddedApplicabilityDate), 'PPP') : 'N/A'} />
                
                <Separator className="my-4" />
                
                <h3 className="text-lg font-semibold mt-6 mb-2">Evaluations</h3>
                <div className="space-y-4">
                    {record.evaluations.map(evalItem => <EvaluationCard key={evalItem.id} evaluation={evalItem} />)}
                </div>

                <Separator className="my-4" />

                <div className="py-3 border-b">
                    <dt className="font-semibold text-muted-foreground mb-2 flex items-center gap-2"><ListChecks className="h-4 w-4" /> Implementation Task List</dt>
                    <dd>
                        {(record.implementationTasks && record.implementationTasks.length > 0) ? (
                            <ul className="space-y-2">
                                {record.implementationTasks.map(task => (
                                    <li key={task.id} className="text-sm p-2 border rounded-md">
                                        <p className="font-medium">{task.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Est. Compliance Date: {task.estimatedComplianceDate ? format(parseISO(task.estimatedComplianceDate), 'PPP') : 'N/A'}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">Not applicable.</p>
                        )}
                    </dd>
                </div>


                <Separator className="my-4" />


                <h3 className="text-lg font-semibold mt-6 mb-2">Follow Up</h3>
                <DetailRow label="Status Item" value={<Badge variant={record.statusItem === 'CLOSED' ? 'default' : 'destructive'}>{record.statusItem}</Badge>} />
                <DetailRow label="Summary" value={record.summary} isLongText />
                
                 <div className="py-3 border-b">
                    <dt className="font-semibold text-muted-foreground mb-2 flex items-center gap-2"><User className="h-4 w-4" /> DGCA Authorization</dt>
                    <dd className="space-y-4">
                        <p className='text-sm font-medium'>Inspectors:</p>
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
                         <p className='text-sm font-medium pt-2'>Verified by:</p>
                        {record.verifiers?.map((verifier) => (
                        <div key={verifier.id} className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-4 border p-3 rounded-md">
                           <div>
                                <p><span className="font-medium">Name:</span> {verifier.name}</p>
                                <p><span className="font-medium">Date:</span> {verifier.date ? format(parseISO(verifier.date), 'PPP') : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-medium mb-1">Signature:</p>
                                {verifier.signature ? (
                                    <div className="bg-white p-2 border rounded-md max-w-[200px]">
                                        <Image src={verifier.signature} alt={`Signature of ${verifier.name}`} width={200} height={100} className="w-full h-auto" />
                                    </div>
                                ) : (
                                    <span>N/A</span>
                                )}
                            </div>
                        </div>
                        ))}
                    </dd>
                </div>
                
                <DetailRow label="Created At" value={getFormattedDate(record.createdAt)} />
            </dl>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

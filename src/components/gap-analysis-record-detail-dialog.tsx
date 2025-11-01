
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { EvaluationItem, GapAnalysisRecord, ActionRequiredItem, ImplementationTaskItem, Verifier, User } from '@/lib/types';
import { Badge } from './ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { User as UserIcon, ListChecks, Printer, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { createExportRecord } from '@/lib/actions/verification';
import QRCode from 'qrcode';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const userId = localStorage.getItem('loggedInUserId');
    if (userId) {
        getDoc(doc(db, "users", userId)).then(userSnap => {
            if (userSnap.exists()) {
                setCurrentUser({ id: userSnap.id, ...userSnap.data() } as User);
            }
        });
    }
  }, []);

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
          return format(parsedDate, 'PPP');
        }
      }
      if (dateValue instanceof Date) {
        return format(dateValue, 'PPP');
      }
      if (typeof dateValue === 'object' && 'toDate' in dateValue && typeof dateValue.toDate === 'function') {
        return format(dateValue.toDate(), 'PPP');
      }
    } catch (e) {
      console.error('Date formatting failed:', e);
      return 'Invalid Date';
    }
    return String(dateValue);
  };
  
  const loadImageAsDataURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } else {
                reject(new Error('Could not get canvas context.'));
            }
        };
        img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
        img.src = url;
    });
  };

 const handleExportPdf = async () => {
    setIsExporting(true);
    if (!currentUser) {
      toast({ variant: "destructive", title: "User not found", description: "Could not identify the current user to create a verified export." });
      setIsExporting(false);
      return;
    }

    const exportRecord = await createExportRecord({
      documentType: `GAP Analysis for ${record.slReferenceNumber}`,
      exportedAt: new Date(),
      exportedBy: { id: currentUser.id, name: currentUser.name },
      filters: { recordId: record.id },
    });

    if (!exportRecord.success || !exportRecord.id) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not create an export record for verification." });
      setIsExporting(false);
      return;
    }
    
    const verificationUrl = `https://stdatabase.site/verify/${exportRecord.id}`;

    try {
        const doc = new jsPDF({ orientation: 'portrait' });
        const qrDataUrl = await QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H' });

        const addHeaderAndFooter = (data: any) => {
            const pageCount = (doc as any).internal.getNumberOfPages();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            doc.setFontSize(16);
            doc.text("GAP Analysis Details", 14, 20);
            
            const footerY = pageHeight - 15;
            doc.setFontSize(8);
            doc.addImage(qrDataUrl, 'PNG', 14, footerY - 5, 15, 15);
            doc.text('Genuine Document by AirTrack', 32, footerY);
            const copyrightText = `Copyright © AirTrack ${new Date().getFullYear()}`;
            doc.text(copyrightText, pageWidth / 2, footerY, { align: 'center' });
            doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth - 14, footerY, { align: 'right' });
        };

        const generalData = [
            ['SL Ref. Number', record.slReferenceNumber],
            ['SL Ref. Date', getFormattedDate(record.slReferenceDate)],
            ['Annex', record.annex],
            ['Subject', record.subject],
            ['Status', record.statusItem],
            ['Date of Evaluation', getFormattedDate(record.dateOfEvaluation)],
            ['Effective Date', getFormattedDate(record.effectiveDate)],
            ['Applicability Date', getFormattedDate(record.applicabilityDate)],
        ];

        autoTable(doc, {
            startY: 30,
            theme: 'plain',
            body: generalData,
            styles: { fontSize: 9, cellPadding: 1.5 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 'auto', cellPadding: {left: 2}} },
            didDrawPage: addHeaderAndFooter,
        });

        // --- Action Required ---
        autoTable(doc, {
            head: [['Action Required']],
            body: (record.actionRequired || []).map(item => {
                let text = actionRequiredLabels[item.id];
                if (item.checked && item.date) {
                    text += ` (Date: ${getFormattedDate(item.date)})`;
                }
                return [item.checked ? `[X] ${text}` : `[ ] ${text}`];
            }),
            startY: (doc as any).lastAutoTable.finalY + 5,
            theme: 'striped',
            headStyles: { fillColor: [22, 160, 133], textColor: 255 },
            didDrawPage: addHeaderAndFooter,
        });
        
        // --- Evaluations ---
        record.evaluations.forEach((evaluation, index) => {
            const evaluationBody = [
                ['ICAO SARP', evaluation.icaoSarp],
                ['Review', evaluation.review],
                ['Compliance Status', evaluation.complianceStatus],
                ['CASR Affected', evaluation.casrAffected],
                ['Follow Up', evaluation.followUp || '-'],
                ['Proposed Amendment', evaluation.proposedAmendment || '-'],
                ['Reason/Remark', evaluation.reasonOrRemark || '-'],
                ['Status Item', evaluation.status || 'N/A'],
            ].map(([title, content]) => ([
                { content: title, styles: { fontStyle: 'bold', cellWidth: 50 } },
                { content: String(content), styles: { cellWidth: 'auto', cellPadding: {left: 2}} }
            ]));

            autoTable(doc, {
                head: [[`Evaluation Item ${index + 1}`]],
                body: evaluationBody,
                startY: (doc as any).lastAutoTable.finalY + 10,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                styles: { fontSize: 9, cellPadding: 2, lineWidth: 0.1 },
                didDrawPage: addHeaderAndFooter,
            });
        });

        // --- Implementation Tasks ---
        if (record.implementationTasks && record.implementationTasks.length > 0) {
            autoTable(doc, {
                head: [['Implementation Task List']],
                body: record.implementationTasks.map(task => [
                    `${task.description}\nEst. Compliance Date: ${getFormattedDate(task.estimatedComplianceDate)}`
                ]),
                startY: (doc as any).lastAutoTable.finalY + 10,
                theme: 'striped',
                headStyles: { fillColor: [22, 160, 133], textColor: 255 },
                didDrawPage: addHeaderAndFooter,
            });
        }

        // --- Summary ---
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Summary']],
            body: [[record.summary || 'No summary provided.']],
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] },
            didDrawPage: addHeaderAndFooter,
        });

        // --- DGCA Authorization ---
        let startY = (doc as any).lastAutoTable.finalY + 10;
        
        const signaturePromises: Promise<{name: string, dataUrl: string, type: 'Inspector' | 'Verifier', date?: string}>[] = [];

        (record.inspectors || []).forEach(inspector => {
            if (inspector.signature) {
                signaturePromises.push(
                    loadImageAsDataURL(inspector.signature).then(dataUrl => ({ name: inspector.name, dataUrl, type: 'Inspector' }))
                );
            }
        });
        (record.verifiers || []).forEach(verifier => {
            if (verifier.signature) {
                signaturePromises.push(
                    loadImageAsDataURL(verifier.signature).then(dataUrl => ({ name: verifier.name, dataUrl, type: 'Verifier', date: verifier.date }))
                );
            }
        });

        const signatureDataUrls = await Promise.all(signaturePromises);
        
        if (signatureDataUrls.length > 0) {
            if (startY + 10 + 40 > doc.internal.pageSize.getHeight() - 20) {
              doc.addPage();
              startY = 30; 
              addHeaderAndFooter({ pageNumber: (doc as any).internal.getNumberOfPages() });
            }
            
            doc.setFontSize(14);
            doc.text("DGCA Authorization Signatures", 14, startY);
            startY += 10;
            
            signatureDataUrls.forEach(({ name, dataUrl, type, date }) => {
                if (startY + 40 > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                    startY = 30;
                    addHeaderAndFooter({ pageNumber: (doc as any).internal.getNumberOfPages() });
                }
                doc.setFontSize(10);
                doc.text(`${type}: ${name}`, 14, startY);
                if (date) {
                    doc.setFontSize(8);
                    doc.text(`Date: ${getFormattedDate(date)}`, 14, startY + 5);
                }
                doc.addImage(dataUrl, 'PNG', 14, startY + 8, 60, 30);
                startY += 40;
            });
        }
      
      doc.save(`GAP_Analysis_${record.slReferenceNumber}.pdf`);
      toast({ title: "Export successful", description: "Your PDF has been downloaded." });

    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Export Error', description: 'Failed to generate PDF. One or more images may have failed to load.' });
    } finally {
        setIsExporting(false);
    }
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
                <DetailRow label="SL Reference Date" value={getFormattedDate(record.slReferenceDate)} />
                <DetailRow label="Annex" value={record.annex} />
                <DetailRow label="Type of State Letter" value={record.typeOfStateLetter} />
                <DetailRow label="Date of Evaluation" value={getFormattedDate(record.dateOfEvaluation)} />
                <DetailRow label="Subject" value={record.subject} isLongText />
                <DetailRow label="Nama Surat" value={record.letterName} />
                <DetailRow label="Perihal Surat" value={record.letterSubject} isLongText />
                <DetailRow label="Tanggal Pelaksanaan" value={getFormattedDate(record.implementationDate)} />
                <DetailRow label="Action Required" value={actionRequiredContent} isLongText />
                <DetailRow label="Effective Date" value={getFormattedDate(record.effectiveDate)} />
                <DetailRow label="Applicability Date" value={getFormattedDate(record.applicabilityDate)} />
                <DetailRow label="Embedded Applicability Date" value={getFormattedDate(record.embeddedApplicabilityDate)} />
                
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
                                            Est. Compliance Date: {getFormattedDate(task.estimatedComplianceDate)}
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
                    <dt className="font-semibold text-muted-foreground mb-2 flex items-center gap-2"><UserIcon className="h-4 w-4" /> DGCA Authorization</dt>
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
                                <p><span className="font-medium">Date:</span> {getFormattedDate(verifier.date)}</p>
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
        <DialogFooter>
            <Button variant="outline" onClick={handleExportPdf} disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                Export to PDF
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

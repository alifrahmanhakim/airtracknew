
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TindakLanjutRecord } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { format, parseISO } from 'date-fns';

interface OperatorFollowUpDialogProps {
  operatorName: string;
  records: TindakLanjutRecord[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OperatorFollowUpDialog({
  operatorName,
  records,
  open,
  onOpenChange,
}: OperatorFollowUpDialogProps) {
  const filteredRecords = React.useMemo(() => {
    return records.filter(record => 
        (Array.isArray(record.penerimaRekomendasi) && record.penerimaRekomendasi.includes(operatorName)) ||
        (typeof record.penerimaRekomendasi === 'string' && record.penerimaRekomendasi === operatorName)
    );
  }, [records, operatorName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pending Follow-Ups for: {operatorName}</DialogTitle>
          <DialogDescription>
            Showing {filteredRecords.length} pending recommendation(s) for this operator.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1">
            <div className="space-y-4 pr-4">
                {filteredRecords.map(record => (
                    <Card key={record.id} className="bg-card">
                        <CardHeader>
                            <CardTitle className="text-base">{record.judulLaporan}</CardTitle>
                            <p className="text-xs text-muted-foreground">{record.nomorLaporan}</p>
                        </CardHeader>
                        <CardContent>
                             <dl className="text-xs space-y-2">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Status</dt>
                                    <dd><Badge variant="outline">{record.status}</Badge></dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Incident Date</dt>
                                    <dd>{record.tanggalKejadian ? format(parseISO(record.tanggalKejadian), 'dd MMM yyyy') : 'N/A'}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Report Date</dt>
                                    <dd>{record.tanggalTerbit ? format(parseISO(record.tanggalTerbit), 'dd MMM yyyy') : 'N/A'}</dd>
                                </div>
                             </dl>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

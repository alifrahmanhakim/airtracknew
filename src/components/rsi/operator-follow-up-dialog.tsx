
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
import { cn } from '@/lib/utils';

interface OperatorFollowUpDialogProps {
  operatorName: string;
  records: TindakLanjutRecord[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusClass = (status: string) => {
    switch (status) {
      case 'Final': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Draft': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'Draft Final': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'Preliminary': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'Interim Statement': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'Usulan': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

const getCardBgClass = (status: string) => {
    switch (status) {
        case 'Final': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50';
        case 'Draft': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50';
        case 'Draft Final': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50';
        case 'Preliminary': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50';
        case 'Interim Statement': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50';
        case 'Usulan': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50';
        default: return 'bg-card';
    }
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
                    <Card key={record.id} className={cn("bg-card", getCardBgClass(record.status))}>
                        <CardHeader>
                            <CardTitle className="text-base">{record.judulLaporan}</CardTitle>
                            <p className="text-xs text-muted-foreground">{record.nomorLaporan}</p>
                        </CardHeader>
                        <CardContent>
                             <dl className="text-xs space-y-2">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Status</dt>
                                    <dd>
                                      <Badge className={cn(getStatusClass(record.status))}>
                                        {record.status}
                                      </Badge>
                                    </dd>
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

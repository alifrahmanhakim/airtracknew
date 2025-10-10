

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { GlossaryRecord } from '@/lib/types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Pencil, Trash2, ArrowUpDown, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { cn } from '@/lib/utils';
import { EditGlossaryRecordDialog } from './edit-glossary-record-dialog';
import { GlossaryRecordDetailDialog } from './glossary-record-detail-dialog';
import { Highlight } from './ui/highlight';


type GlossaryRecordsTableProps = {
  records: GlossaryRecord[];
  onDelete: (record: GlossaryRecord) => void;
  onUpdate: (updatedRecord: GlossaryRecord) => void;
  sort: SortDescriptor;
  setSort: (sort: SortDescriptor) => void;
  searchTerm: string;
};

type SortDescriptor = {
    column: keyof GlossaryRecord;
    direction: 'asc' | 'desc';
} | null;

export function GlossaryRecordsTable({ records, onDelete, onUpdate, sort, setSort, searchTerm }: GlossaryRecordsTableProps) {
  const [recordToView, setRecordToView] = useState<GlossaryRecord | null>(null);

  const handleSort = (column: keyof GlossaryRecord) => {
    setSort(prevSort => {
        if (prevSort?.column === column) {
            return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { column, direction: 'asc' };
    });
  }

  const renderSortIcon = (column: keyof GlossaryRecord) => {
      if (sort?.column !== column) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
      return sort.direction === 'asc' ? <ArrowUpDown className="h-4 w-4 ml-2" /> : <ArrowUpDown className="h-4 w-4 ml-2" />;
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No records found for the current filter.</p>
        <p className="text-sm">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
        <div className="border rounded-md w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('tsu')}>
                    <div className="flex items-center">TSU {renderSortIcon('tsu')}</div>
                </TableHead>
                <TableHead>TSA</TableHead>
                <TableHead>Editing</TableHead>
                <TableHead>Makna</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Referensi</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                     <div className="flex items-center">Status {renderSortIcon('status')}</div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} className="cursor-pointer align-top" onClick={() => setRecordToView(record)}>
                    <TableCell className="font-semibold whitespace-normal"><Highlight text={record.tsu} query={searchTerm} /></TableCell>
                    <TableCell className="whitespace-normal"><Highlight text={record.tsa} query={searchTerm} /></TableCell>
                    <TableCell className="whitespace-normal"><Highlight text={record.editing} query={searchTerm} /></TableCell>
                    <TableCell className="whitespace-normal"><Highlight text={record.makna} query={searchTerm} /></TableCell>
                    <TableCell className="whitespace-normal"><Highlight text={record.keterangan} query={searchTerm} /></TableCell>
                    <TableCell className="whitespace-normal"><Highlight text={record.referensi} query={searchTerm} /></TableCell>
                    <TableCell>
                        <Badge
                            variant={record.status === 'Final' ? 'default' : 'secondary'}
                            className={cn(record.status === 'Final' ? 'bg-green-100 text-green-800' : '')}
                        >
                            <Highlight text={record.status} query={searchTerm} />
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                            <EditGlossaryRecordDialog record={record} onRecordUpdate={onUpdate} />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(record)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Delete Record</p></TooltipContent>
                            </Tooltip>
                        </div>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {recordToView && (
            <GlossaryRecordDetailDialog
                record={recordToView}
                open={!!recordToView}
                onOpenChange={(open) => {
                if (!open) setRecordToView(null);
                }}
            />
        )}
    </TooltipProvider>
  );
}

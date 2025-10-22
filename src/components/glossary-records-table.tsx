
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
import { Highlight } from './ui/highlight';
import { format, parseISO } from 'date-fns';


type GlossaryRecordsTableProps = {
  records: GlossaryRecord[];
  onDelete: (record: GlossaryRecord) => void;
  onUpdate: (updatedRecord: GlossaryRecord) => void;
  sort: SortDescriptor;
  setSort: (sort: SortDescriptor) => void;
  searchTerm: string;
};

type SortDescriptor = {
    column: keyof GlossaryRecord | 'createdAt' | 'statusDate';
    direction: 'asc' | 'desc';
} | null;

export function GlossaryRecordsTable({ records, onDelete, onUpdate, sort, setSort, searchTerm }: GlossaryRecordsTableProps) {
  const [recordToEdit, setRecordToEdit] = useState<GlossaryRecord | null>(null);

  const handleSort = (column: keyof GlossaryRecord | 'createdAt' | 'statusDate') => {
    setSort(prevSort => {
        if (prevSort?.column === column) {
            return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { column, direction: 'asc' };
    });
  }

  const renderSortIcon = (column: keyof GlossaryRecord | 'createdAt' | 'statusDate') => {
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
    <>
      <TooltipProvider>
          <div className="border rounded-md w-full overflow-x-auto">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[15%] cursor-pointer text-left" onClick={() => handleSort('tsu')}>
                      <div className="flex items-center">TSU {renderSortIcon('tsu')}</div>
                  </TableHead>
                  <TableHead className="w-[15%] text-left">TSA</TableHead>
                  <TableHead className="w-[15%] text-left">Editing</TableHead>
                  <TableHead className="w-[15%] text-left">Makna</TableHead>
                  <TableHead className="w-[15%] text-left">Keterangan</TableHead>
                  <TableHead className="w-[15%] text-left">Referensi</TableHead>
                  <TableHead className="w-[10%] cursor-pointer text-left" onClick={() => handleSort('status')}>
                      <div className="flex items-center">Status {renderSortIcon('status')}</div>
                  </TableHead>
                  <TableHead className="w-[10%] cursor-pointer text-left" onClick={() => handleSort('statusDate')}>
                      <div className="flex items-center">Status Date {renderSortIcon('statusDate')}</div>
                  </TableHead>
                   <TableHead className="w-[10%] cursor-pointer text-left" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center">Date Added {renderSortIcon('createdAt')}</div>
                  </TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const lastStatusHistory = record.statusHistory && record.statusHistory.length > 0
                    ? record.statusHistory[record.statusHistory.length - 1]
                    : null;
                  
                  return (
                    <TableRow key={record.id} className="cursor-pointer align-top" onClick={() => setRecordToEdit(record)}>
                        <TableCell className="font-semibold whitespace-normal break-words text-left"><Highlight text={record.tsu} query={searchTerm} /></TableCell>
                        <TableCell className="whitespace-normal break-words text-left"><Highlight text={record.tsa} query={searchTerm} /></TableCell>
                        <TableCell className="whitespace-normal break-words text-left"><Highlight text={record.editing} query={searchTerm} /></TableCell>
                        <TableCell className="whitespace-normal break-words text-left"><Highlight text={record.makna} query={searchTerm} /></TableCell>
                        <TableCell className="whitespace-normal break-words text-left"><Highlight text={record.keterangan} query={searchTerm} /></TableCell>
                        <TableCell className="whitespace-normal break-words text-left"><Highlight text={record.referensi || ''} query={searchTerm} /></TableCell>
                        <TableCell className="text-left">
                            <Badge
                                className={cn({
                                    'bg-green-100 text-green-800 hover:bg-green-200': record.status === 'Final',
                                    'bg-yellow-100 text-yellow-800 hover:bg-yellow-200': record.status === 'Draft',
                                    'bg-red-100 text-red-800 hover:bg-red-200': record.status === 'Usulan',
                                })}
                            >
                                <Highlight text={record.status} query={searchTerm} />
                            </Badge>
                        </TableCell>
                        <TableCell className="text-left">
                          {lastStatusHistory ? format(parseISO(lastStatusHistory.date), 'dd MMM yyyy, HH:mm') : 'N/A'}
                        </TableCell>
                         <TableCell className="text-left">
                            {record.createdAt ? format(parseISO(record.createdAt as string), 'dd MMM yyyy, HH:mm') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-0">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => setRecordToEdit(record)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Edit Record</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(record); }}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Delete Record</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
      </TooltipProvider>

      {recordToEdit && (
        <EditGlossaryRecordDialog
          record={recordToEdit}
          onRecordUpdate={(updatedRecord) => {
            onUpdate(updatedRecord);
            setRecordToEdit(null);
          }}
          open={!!recordToEdit}
          onOpenChange={(open) => {
            if (!open) setRecordToEdit(null);
          }}
        />
      )}
    </>
  );
}

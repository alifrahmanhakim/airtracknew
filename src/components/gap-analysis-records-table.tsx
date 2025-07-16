
'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { GapAnalysisRecord } from '@/lib/types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Trash2, ArrowUpDown, Search, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { format, parseISO } from 'date-fns';

type GapAnalysisRecordsTableProps = {
  records: GapAnalysisRecord[];
  onDelete: (record: GapAnalysisRecord) => void;
};

type SortDescriptor = {
    column: keyof GapAnalysisRecord;
    direction: 'asc' | 'desc';
} | null;


export function GapAnalysisRecordsTable({ records, onDelete }: GapAnalysisRecordsTableProps) {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<SortDescriptor>({ column: 'createdAt', direction: 'desc' });

  const processedRecords = useMemo(() => {
    let filteredData = [...records];
    
    if (filter) {
        const lowercasedFilter = filter.toLowerCase();
        filteredData = filteredData.filter(record => 
            Object.values(record).some(value => 
                String(value).toLowerCase().includes(lowercasedFilter)
            )
        );
    }

    if (sort) {
        filteredData.sort((a, b) => {
            const aVal = a[sort.column as keyof GapAnalysisRecord] ?? '';
            const bVal = b[sort.column as keyof GapAnalysisRecord] ?? '';
            
            if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return filteredData;
  }, [records, filter, sort]);

  const handleSort = (column: keyof GapAnalysisRecord) => {
    setSort(prevSort => {
        if (prevSort?.column === column) {
            return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { column, direction: 'asc' };
    });
  }

  const renderSortIcon = (column: keyof GapAnalysisRecord) => {
      if (sort?.column !== column) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
      return sort.direction === 'asc' ? <ArrowUpDown className="h-4 w-4 ml-2" /> : <ArrowUpDown className="h-4 w-4 ml-2" />;
  }
  
  if (records.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No records found.</p>
        <p className="text-sm">Submit the form to add a new record.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Filter records..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="pl-9 w-full"
            />
        </div>
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort('slReferenceNumber')} className="cursor-pointer">
                    <div className="flex items-center">SL Ref. Number {renderSortIcon('slReferenceNumber')}</div>
                </TableHead>
                <TableHead onClick={() => handleSort('subject')} className="cursor-pointer">
                    <div className="flex items-center">Subject {renderSortIcon('subject')}</div>
                </TableHead>
                <TableHead onClick={() => handleSort('statusItem')} className="cursor-pointer">
                    <div className="flex items-center">Status {renderSortIcon('statusItem')}</div>
                </TableHead>
                 <TableHead onClick={() => handleSort('dateOfEvaluation')} className="cursor-pointer">
                    <div className="flex items-center">Evaluation Date {renderSortIcon('dateOfEvaluation')}</div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.slReferenceNumber}</TableCell>
                  <TableCell className="font-medium">{record.subject}</TableCell>
                  <TableCell>
                    <Badge variant={record.statusItem === 'CLOSED' ? 'default' : 'destructive'}>
                      {record.statusItem}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(parseISO(record.dateOfEvaluation), 'PPP')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       {/* Edit Dialog would go here */}
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
          {processedRecords.length === 0 && (
            <div className="text-center p-6 text-muted-foreground">
                <p>No matching records found.</p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

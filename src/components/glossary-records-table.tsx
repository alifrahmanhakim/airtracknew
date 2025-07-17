
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
import type { GlossaryRecord } from '@/lib/types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Pencil, Trash2, ArrowUpDown, Search, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

type GlossaryRecordsTableProps = {
  records: GlossaryRecord[];
  onDelete: (record: GlossaryRecord) => void;
  onUpdate: (updatedRecord: GlossaryRecord) => void;
};

type SortDescriptor = {
    column: keyof GlossaryRecord;
    direction: 'asc' | 'desc';
} | null;

export function GlossaryRecordsTable({ records, onDelete, onUpdate }: GlossaryRecordsTableProps) {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<SortDescriptor>({ column: 'term', direction: 'asc' });

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
            const aVal = a[sort.column as keyof GlossaryRecord] ?? '';
            const bVal = b[sort.column as keyof GlossaryRecord] ?? '';
            
            if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return filteredData;
  }, [records, filter, sort]);

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
        <p className="font-semibold">No terms found.</p>
        <p className="text-sm">Submit the form to add a new term to the glossary.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Filter by term, definition, source, or tag..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="pl-9 w-full max-w-sm"
            />
        </div>
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('term')}>
                    <div className="flex items-center">Term {renderSortIcon('term')}</div>
                </TableHead>
                <TableHead>Definition</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('source')}>
                     <div className="flex items-center">Source {renderSortIcon('source')}</div>
                </TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedRecords.map((record) => (
                <TableRow key={record.id}>
                    <TableCell className="font-semibold">{record.term}</TableCell>
                    <TableCell className="max-w-md">{record.definition}</TableCell>
                    <TableCell>{record.source}</TableCell>
                    <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {record.tags?.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            {/* <EditGlossaryRecordDialog record={record} onRecordUpdate={onUpdate} /> */}
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

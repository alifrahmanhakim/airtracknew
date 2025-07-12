
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
import type { CcefodFormValues } from './ccefod-form';
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
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

type CcefodRecordsTableProps = {
  records: CcefodFormValues[];
};

type SortDescriptor = {
    column: keyof CcefodFormValues;
    direction: 'asc' | 'desc';
} | null;

export function CcefodRecordsTable({ records }: CcefodRecordsTableProps) {
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
            const aVal = a[sort.column] ?? '';
            const bVal = b[sort.column] ?? '';
            
            if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return filteredData;
  }, [records, filter, sort]);

  const handleSort = (column: keyof CcefodFormValues) => {
    setSort(prevSort => {
        if (prevSort?.column === column) {
            return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { column, direction: 'asc' };
    });
  }

  const renderSortIcon = (column: keyof CcefodFormValues) => {
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
        <div className="flex justify-between items-center">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Filter records..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="pl-9"
                />
            </div>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('annex')}>
                    <div className="flex items-center">Annex {renderSortIcon('annex')}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('annexReference')}>
                    <div className="flex items-center">Annex Ref. {renderSortIcon('annexReference')}</div>
                </TableHead>
                 <TableHead className="cursor-pointer" onClick={() => handleSort('standardPractice')}>
                    <div className="flex items-center">Standard/Practice {renderSortIcon('standardPractice')}</div>
                </TableHead>
                 <TableHead className="cursor-pointer" onClick={() => handleSort('legislationReference')}>
                    <div className="flex items-center">Legislation {renderSortIcon('legislationReference')}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center">Status {renderSortIcon('status')}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center">Created At {renderSortIcon('createdAt')}</div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{record.annex}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{record.annex}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{record.annexReference}</TableCell>
                   <TableCell className="max-w-[200px] truncate">
                    <Tooltip>
                        <TooltipTrigger asChild><span>{record.standardPractice}</span></TooltipTrigger>
                        <TooltipContent className="max-w-md"><p>{record.standardPractice}</p></TooltipContent>
                    </Tooltip>
                   </TableCell>
                   <TableCell className="max-w-[200px] truncate">
                    <Tooltip>
                        <TooltipTrigger asChild><span>{record.legislationReference}</span></TooltipTrigger>
                        <TooltipContent className="max-w-md"><p>{record.legislationReference}</p></TooltipContent>
                    </Tooltip>
                   </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.status === 'Final'
                          ? 'default'
                          : record.status === 'Draft'
                          ? 'secondary'
                          : 'outline'
                      }
                      className={cn({'bg-emerald-500/80 text-white': record.status === 'Final'})}
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                      {record.createdAt ? format(parseISO(record.createdAt), 'PPP') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Edit Record</p></TooltipContent>
                       </Tooltip>
                       <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
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

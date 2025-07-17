

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
import { cn } from '@/lib/utils';
import { EditGlossaryRecordDialog } from './edit-glossary-record-dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from './ui/pagination';

type GlossaryRecordsTableProps = {
  records: GlossaryRecord[];
  onDelete: (record: GlossaryRecord) => void;
  onUpdate: (updatedRecord: GlossaryRecord) => void;
};

type SortDescriptor = {
    column: keyof GlossaryRecord;
    direction: 'asc' | 'desc';
} | null;

const RECORDS_PER_PAGE = 10;

export function GlossaryRecordsTable({ records, onDelete, onUpdate }: GlossaryRecordsTableProps) {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<SortDescriptor>({ column: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

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
  
  const totalPages = Math.ceil(processedRecords.length / RECORDS_PER_PAGE);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    const endIndex = startIndex + RECORDS_PER_PAGE;
    return processedRecords.slice(startIndex, endIndex);
  }, [processedRecords, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
    }
  }


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
        <p className="font-semibold">No records found.</p>
        <p className="text-sm">Submit the form to add a new analysis record.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Filter by any field..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="pl-9 w-full max-w-sm"
            />
        </div>
        <div className="border rounded-md overflow-x-auto">
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
              {paginatedRecords.map((record) => (
                <TableRow key={record.id}>
                    <TableCell className="font-semibold max-w-xs truncate">{record.tsu}</TableCell>
                    <TableCell className="max-w-xs truncate">{record.tsa}</TableCell>
                    <TableCell className="max-w-xs truncate">{record.editing}</TableCell>
                    <TableCell className="max-w-xs truncate">{record.makna}</TableCell>
                    <TableCell className="max-w-xs truncate">{record.keterangan}</TableCell>
                    <TableCell className="max-w-xs truncate">{record.referensi}</TableCell>
                    <TableCell>
                        <Badge
                            variant={record.status === 'Final' ? 'default' : 'secondary'}
                            className={cn(record.status === 'Final' ? 'bg-green-100 text-green-800' : '')}
                        >
                            {record.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
          {processedRecords.length === 0 && (
            <div className="text-center p-6 text-muted-foreground">
                <p>No matching records found.</p>
            </div>
          )}
        </div>
         {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => {e.preventDefault(); handlePageChange(currentPage - 1)}} className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''} />
                </PaginationItem>
                <PaginationItem>
                    <span className="px-4 py-2 text-sm">
                        Page {currentPage} of {totalPages}
                    </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => {e.preventDefault(); handlePageChange(currentPage + 1)}} className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
        )}
      </div>
    </TooltipProvider>
  );
}

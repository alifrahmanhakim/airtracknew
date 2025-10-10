

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
import type { PqRecord } from '@/lib/types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Pencil, Trash2, ArrowUpDown, Search, Info, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { cn } from '@/lib/utils';
import { EditPqRecordDialog } from './edit-pq-record-dialog';
import { PqRecordDetailDialog } from './pq-record-detail-dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from './ui/pagination';
import { Loader2 } from 'lucide-react';


type PqsRecordsTableProps = {
  records: PqRecord[];
  onDelete: (record: PqRecord) => void;
  onUpdate: (updatedRecord: PqRecord) => void;
  isFetchingPage: boolean;
  totalPages: number;
  currentPage: number;
  handlePageChange: (page: number) => void;
  sort: SortDescriptor;
  setSort: (sort: SortDescriptor) => void;
  filters: {
    searchTerm: string;
    criticalElementFilter: string;
    icaoStatusFilter: string;
  };
  setFilters: {
    setSearchTerm: (value: string) => void;
    setCriticalElementFilter: (value: string) => void;
    setIcaoStatusFilter: (value: string) => void;
  };
  searchInputRef: React.RefObject<HTMLInputElement>;
};

type SortDescriptor = {
    column: keyof PqRecord;
    direction: 'asc' | 'desc';
} | null;

const criticalElementOptions = ["CE - 1", "CE - 2", "CE - 3", "CE - 4", "CE - 5", "CE - 6", "CE - 7", "CE - 8"];
const icaoStatusOptions = ["Satisfactory", "No Satisfactory"];

export function PqsRecordsTable({ 
  records, 
  onDelete, 
  onUpdate, 
  isFetchingPage,
  totalPages,
  currentPage,
  handlePageChange,
  sort,
  setSort,
  filters,
  setFilters,
  searchInputRef
}: PqsRecordsTableProps) {
  const [recordToView, setRecordToView] = useState<PqRecord | null>(null);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    id: false,
    pqNumber: true,
    protocolQuestion: true,
    guidance: true,
    icaoReferences: true,
    ppq: true,
    criticalElement: true,
    remarks: false,
    evidence: true,
    answer: false,
    poc: false,
    icaoStatus: true,
    status: true,
    createdAt: false,
    cap: false,
    sspComponent: false,
  });

  const handleSort = (column: keyof PqRecord) => {
    setSort(prevSort => {
        if (prevSort?.column === column) {
            return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { column, direction: 'asc' };
    });
  };

  const renderSortIcon = (column: keyof PqRecord) => {
      if (sort?.column !== column) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
      return sort.direction === 'asc' ? <ArrowUpDown className="h-4 w-4 ml-2" /> : <ArrowUpDown className="h-4 w-4 ml-2" />;
  };
  
  const columnDefs: { key: keyof PqRecord; header: string; width?: string }[] = [
    { key: 'pqNumber', header: 'PQ Number' },
    { key: 'protocolQuestion', header: 'Protocol Question' },
    { key: 'guidance', header: 'Guidance' },
    { key: 'icaoReferences', header: 'ICAO References' },
    { key: 'ppq', header: 'PPQ' },
    { key: 'criticalElement', header: 'Critical Element'},
    { key: 'remarks', header: 'Remarks'},
    { key: 'evidence', header: 'Evidence'},
    { key: 'answer', header: 'Answer'},
    { key: 'poc', header: 'POC'},
    { key: 'icaoStatus', header: 'ICAO Status'},
    { key: 'cap', header: 'CAP'},
    { key: 'sspComponent', header: 'SSP Component'},
    { key: 'status', header: 'Status' },
    { key: 'createdAt', header: 'Created At' },
  ];

  const visibleColumns = columnDefs.filter(c => columnVisibility[c.key as keyof PqRecord]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
             <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        ref={searchInputRef}
                        placeholder="Search by PQ number..."
                        value={filters.searchTerm}
                        onChange={e => setFilters.setSearchTerm(e.target.value)}
                        className="pl-9 w-full"
                    />
                </div>
                <Select value={filters.criticalElementFilter} onValueChange={setFilters.setCriticalElementFilter}>
                    <SelectTrigger><SelectValue placeholder="Filter by CE..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Critical Elements</SelectItem>
                        {criticalElementOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filters.icaoStatusFilter} onValueChange={setFilters.setIcaoStatusFilter}>
                    <SelectTrigger><SelectValue placeholder="Filter by ICAO Status..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All ICAO Statuses</SelectItem>
                        {icaoStatusOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="sm:ml-auto w-full sm:w-auto">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {columnDefs.map((col) => {
                        return (
                            <DropdownMenuCheckboxItem
                            key={col.key}
                            className="capitalize"
                            checked={columnVisibility[col.key]}
                            onCheckedChange={(value) =>
                                setColumnVisibility(prev => ({...prev, [col.key]: !!value }))
                            }
                            >
                            {col.header}
                            </DropdownMenuCheckboxItem>
                        )
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {isFetchingPage ? <div className='flex items-center justify-center p-8'><Loader2 className="mr-2 h-8 w-8 animate-spin" /> Loading...</div> :
        (records.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
            <Info className="mx-auto h-8 w-8 mb-2" />
            <p className="font-semibold">No records found for the current filter.</p>
            <p className="text-sm">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
        <>
          <div className="border rounded-md w-full overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader className="sticky top-0 bg-background/95 z-10">
                <TableRow>
                  {visibleColumns.map((col) => (
                      <TableHead 
                          key={col.key} 
                          className={cn("cursor-pointer whitespace-nowrap align-middle", col.key === 'protocolQuestion' && 'w-1/3')} 
                          onClick={() => handleSort(col.key as keyof PqRecord)}
                      >
                          <div className="flex items-center">{col.header} {renderSortIcon(col.key as keyof PqRecord)}</div>
                      </TableHead>
                  ))}
                  <TableHead className="text-right sticky right-0 bg-background/95 z-10 w-[100px] align-middle">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow 
                      key={record.id} 
                      className="cursor-pointer" 
                      onClick={() => setRecordToView(record)}
                  >
                      {visibleColumns.map((col) => (
                          <TableCell key={col.key} className="align-middle whitespace-normal">
                              {(() => {
                                  const value = record[col.key as keyof PqRecord] as string | undefined;
                                  
                                  if (col.key === 'status') {
                                      return (<Badge
                                      className={cn({
                                          'bg-green-100 text-green-800 hover:bg-green-200': value === 'Final',
                                          'bg-yellow-100 text-yellow-800 hover:bg-yellow-200': value === 'Draft',
                                          'bg-secondary text-secondary-foreground hover:bg-secondary/80': value === 'Existing',
                                      })}
                                      >
                                      {value}
                                      </Badge>);
                                  }

                                  if (value === null || value === undefined || value === '') {
                                      return <span className='text-muted-foreground'>—</span>;
                                  }
                                  
                                  return <div className="truncate-multiline">{value}</div>;
                              })()}
                          </TableCell>
                      ))}
                      <TableCell className="text-right sticky right-0 bg-background/95 align-middle">
                          <div className="flex justify-end gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                              <EditPqRecordDialog record={record} onRecordUpdate={onUpdate} />
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
                <PaginationNext href="#" onClick={(e) => {e.preventDefault(); handlePageChange(currentPage + 1)}} className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      ))}
      </div>
      {recordToView && (
        <PqRecordDetailDialog 
            record={recordToView}
            open={!!recordToView}
            onOpenChange={(open) => { if(!open) setRecordToView(null) }}
        />
      )}
    </TooltipProvider>
  );
}

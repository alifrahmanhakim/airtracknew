
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { EditPqRecordDialog } from './edit-pq-record-dialog';
import { PqRecordDetailDialog } from './pq-record-detail-dialog';


type PqsRecordsTableProps = {
  records: PqRecord[];
  onDelete: (record: PqRecord) => void;
  onUpdate: (updatedRecord: PqRecord) => void;
};

type SortDescriptor = {
    column: keyof PqRecord;
    direction: 'asc' | 'desc';
} | null;

export function PqsRecordsTable({ records, onDelete, onUpdate }: PqsRecordsTableProps) {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<SortDescriptor>({ column: 'createdAt', direction: 'desc' });
  const [recordToView, setRecordToView] = useState<PqRecord | null>(null);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    id: false,
    createdAt: true,
    pqNumber: true,
    protocolQuestion: true,
    guidance: false,
    icaoReferences: false,
    ppq: true,
    criticalElement: true,
    remarks: false,
    evidence: false,
    answer: false,
    poc: false,
    icaoStatus: true,
    cap: false,
    sspComponent: false,
    status: true,
  });

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
            const aVal = a[sort.column as keyof PqRecord] ?? '';
            const bVal = b[sort.column as keyof PqRecord] ?? '';
            
            if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return filteredData;
  }, [records, filter, sort]);

  const handleSort = (column: keyof PqRecord) => {
    setSort(prevSort => {
        if (prevSort?.column === column) {
            return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { column, direction: 'asc' };
    });
  }

  const renderSortIcon = (column: keyof PqRecord) => {
      if (sort?.column !== column) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
      return sort.direction === 'asc' ? <ArrowUpDown className="h-4 w-4 ml-2" /> : <ArrowUpDown className="h-4 w-4 ml-2" />;
  }
  
  const columnDefs: { key: keyof PqRecord; header: string; width?: string }[] = [
    { key: 'pqNumber', header: 'PQ Number' },
    { key: 'protocolQuestion', header: 'Protocol Question' },
    { key: 'ppq', header: 'PPQ' },
    { key: 'criticalElement', header: 'Critical Element'},
    { key: 'icaoStatus', header: 'ICAO Status'},
    { key: 'status', header: 'Status' },
    { key: 'createdAt', header: 'Created At' },
  ];

  const visibleColumns = columnDefs.filter(c => columnVisibility[c.key as keyof PqRecord]);

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
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Filter records..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="pl-9"
                />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
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
        <div className="border rounded-md overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                {visibleColumns.map((col, index) => (
                    <TableHead 
                        key={col.key} 
                        className={cn("cursor-pointer whitespace-nowrap", index < visibleColumns.length -1 ? "border-r" : "")} 
                        onClick={() => handleSort(col.key as keyof PqRecord)}>
                        <div className="flex items-center">{col.header} {renderSortIcon(col.key as keyof PqRecord)}</div>
                    </TableHead>
                ))}
                <TableHead className="text-right sticky right-0 bg-background/95 z-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedRecords.map((record) => (
                <TableRow key={record.id} className="border-b cursor-pointer" onClick={() => setRecordToView(record)}>
                  {visibleColumns.map((col, index) => (
                     <TableCell key={col.key} className={cn("whitespace-nowrap", index < visibleColumns.length - 1 ? "border-r" : "")}>
                        {(() => {
                            const value = record[col.key as keyof PqRecord] as string | undefined;
                             const isLongText = ['protocolQuestion'].includes(col.key);
                             const content = (
                                <>
                                {col.key === 'status' && value ? (
                                    <Badge
                                    className={cn({
                                        'bg-green-100 text-green-800 hover:bg-green-200': value === 'Final',
                                        'bg-yellow-100 text-yellow-800 hover:bg-yellow-200': value === 'Draft',
                                        'bg-secondary text-secondary-foreground hover:bg-secondary/80': value === 'Existing',
                                    })}
                                    >
                                    {value}
                                    </Badge>
                                ) : col.key === 'createdAt' && value ? (
                                    format(parseISO(value), 'PPP')
                                ) : (
                                    value || 'N/A'
                                )}
                                </>
                             );

                             if (isLongText && value && value.length > 50) {
                                return (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate max-w-xs">{value}</p>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-md"><p>{value}</p></TooltipContent>
                                </Tooltip>
                                );
                             }
                             return <div className="max-w-xs truncate">{content}</div>;
                        })()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right sticky right-0 bg-background/95 z-10">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
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
          {processedRecords.length === 0 && (
            <div className="text-center p-6 text-muted-foreground">
                <p>No matching records found.</p>
            </div>
          )}
        </div>
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

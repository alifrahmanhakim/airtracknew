
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
import { Pencil, Trash2, ArrowUpDown, Search, Info, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { EditGapAnalysisRecordDialog } from './edit-gap-analysis-record-dialog';
import { GapAnalysisRecordDetailDialog } from './gap-analysis-record-detail-dialog';

type GapAnalysisRecordsTableProps = {
  records: GapAnalysisRecord[];
  onDelete: (record: GapAnalysisRecord) => void;
  onUpdate: (updatedRecord: GapAnalysisRecord) => void;
};

type SortDescriptor = {
    column: keyof GapAnalysisRecord;
    direction: 'asc' | 'desc';
} | null;

export function GapAnalysisRecordsTable({ records, onDelete, onUpdate }: GapAnalysisRecordsTableProps) {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<SortDescriptor>({ column: 'createdAt', direction: 'desc' });
  const [recordToView, setRecordToView] = useState<GapAnalysisRecord | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    id: false,
    createdAt: false,
    slReferenceNumber: true,
    annex: true,
    typeOfStateLetter: true,
    dateOfEvaluation: true,
    subject: true,
    actionRequired: false,
    effectiveDate: false,
    applicabilityDate: false,
    embeddedApplicabilityDate: false,
    evaluations: false,
    statusItem: true,
    summary: false,
    inspectorNames: false,
  });
  
  const typeOfStateLetterOptions = useMemo(() => {
    const types = new Set(records.map(r => r.typeOfStateLetter));
    return ['all', ...Array.from(types)];
  }, [records]);


  const processedRecords = useMemo(() => {
    let filteredData = [...records];
    
    if (statusFilter !== 'all') {
        filteredData = filteredData.filter(record => record.statusItem === statusFilter);
    }
    
    if (typeFilter !== 'all') {
        filteredData = filteredData.filter(record => record.typeOfStateLetter === typeFilter);
    }

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
  }, [records, filter, sort, statusFilter, typeFilter]);

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
  
  const columnDefs: { key: keyof GapAnalysisRecord; header: string; width?: string }[] = [
    { key: 'slReferenceNumber', header: 'SL Ref. Number' },
    { key: 'subject', header: 'Subject' },
    { key: 'typeOfStateLetter', header: 'Type' },
    { key: 'statusItem', header: 'Status' },
    { key: 'dateOfEvaluation', header: 'Evaluation Date' },
    { key: 'annex', header: 'Annex' },
  ];
  
  const visibleColumns = columnDefs.filter(c => columnVisibility[c.key as keyof GapAnalysisRecord]);

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
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Filter records..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="pl-9 w-full"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="OPEN">OPEN</SelectItem>
                        <SelectItem value="CLOSED">CLOSED</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger><SelectValue placeholder="Filter by type..." /></SelectTrigger>
                    <SelectContent>
                        {typeOfStateLetterOptions.map(option => (
                            <SelectItem key={option} value={option}>
                                {option === 'all' ? 'All Types' : option}
                            </SelectItem>
                        ))}
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
                            checked={columnVisibility[col.key as keyof GapAnalysisRecord]}
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
                {visibleColumns.map((col) => (
                    <TableHead 
                        key={col.key} 
                        className="cursor-pointer whitespace-nowrap"
                        onClick={() => handleSort(col.key as keyof GapAnalysisRecord)}>
                        <div className="flex items-center">{col.header} {renderSortIcon(col.key as keyof GapAnalysisRecord)}</div>
                    </TableHead>
                ))}
                <TableHead className="text-right sticky right-0 bg-background/95 z-10 w-[100px] align-middle">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedRecords.map((record) => (
                <TableRow key={record.id} className="border-b cursor-pointer" onClick={() => setRecordToView(record)}>
                    {visibleColumns.map((col) => (
                        <TableCell key={col.key} className="align-top whitespace-normal">
                            {(() => {
                                const value = record[col.key as keyof GapAnalysisRecord] as string | undefined;

                                if (col.key === 'statusItem' && value) {
                                    return (
                                        <Badge variant={value === 'CLOSED' ? 'default' : 'destructive'}>
                                            {value}
                                        </Badge>
                                    );
                                }
                                if (col.key === 'dateOfEvaluation' && value) {
                                    return format(parseISO(value), 'PPP');
                                }
                                return <div>{value || 'N/A'}</div>;
                            })()}
                        </TableCell>
                    ))}
                    <TableCell className="text-right sticky right-0 bg-background/95 z-10 align-top">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <EditGapAnalysisRecordDialog record={record} onRecordUpdate={onUpdate} />
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
        <GapAnalysisRecordDetailDialog
            record={recordToView}
            open={!!recordToView}
            onOpenChange={(open) => { if(!open) setRecordToView(null) }}
        />
      )}
    </TooltipProvider>
  );
}

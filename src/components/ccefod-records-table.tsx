
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
import type { CcefodRecord } from '@/lib/types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Pencil, Trash2, ArrowUpDown, Search, Info, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { Table as TanstackTable, ColumnDef, ColumnFiltersState, SortingState, VisibilityState, flexRender } from '@tanstack/react-table'

type CcefodRecordsTableProps = {
  records: CcefodRecord[];
  onDelete: (record: CcefodRecord) => void;
};

type SortDescriptor = {
    column: keyof CcefodRecord;
    direction: 'asc' | 'desc';
} | null;

export function CcefodRecordsTable({ records, onDelete }: CcefodRecordsTableProps) {
  const [filter, setFilter] = useState('');
  const [annexFilter, setAnnexFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortDescriptor>({ column: 'createdAt', direction: 'desc' });

  const [columnVisibility, setColumnVisibility] = useState<Record<keyof CcefodRecord, boolean>>({
    id: false,
    createdAt: true,
    adaPerubahan: true,
    usulanPerubahan: false,
    isiUsulan: false,
    annex: true,
    annexReference: true,
    standardPractice: false,
    legislationReference: false,
    implementationLevel: true,
    differenceText: false,
    differenceReason: false,
    remarks: false,
    status: true
  });

  const annexOptions = useMemo(() => {
    const annexes = new Set(records.map(r => r.annex));
    return ['all', ...Array.from(annexes)];
  }, [records]);

  const processedRecords = useMemo(() => {
    let filteredData = [...records];
    
    if (annexFilter !== 'all') {
        filteredData = filteredData.filter(record => record.annex === annexFilter);
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
            const aVal = a[sort.column] ?? '';
            const bVal = b[sort.column] ?? '';
            
            if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return filteredData;
  }, [records, filter, annexFilter, sort]);

  const handleSort = (column: keyof CcefodRecord) => {
    setSort(prevSort => {
        if (prevSort?.column === column) {
            return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { column, direction: 'asc' };
    });
  }

  const renderSortIcon = (column: keyof CcefodRecord) => {
      if (sort?.column !== column) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
      return sort.direction === 'asc' ? <ArrowUpDown className="h-4 w-4 ml-2" /> : <ArrowUpDown className="h-4 w-4 ml-2" />;
  }
  
  const columnDefs: { key: keyof CcefodRecord; header: string; width?: string }[] = [
    { key: 'annex', header: 'Annex' },
    { key: 'annexReference', header: 'Annex Ref.' },
    { key: 'standardPractice', header: 'Standard/Practice' },
    { key: 'legislationReference', header: 'Legislation' },
    { key: 'implementationLevel', header: 'Implementation Level'},
    { key: 'status', header: 'Status' },
    { key: 'createdAt', header: 'Created At' },
    { key: 'adaPerubahan', header: 'Ada Perubahan?'},
    { key: 'usulanPerubahan', header: 'Usulan Perubahan'},
    { key: 'isiUsulan', header: 'Isi Usulan'},
    { key: 'differenceText', header: 'Text of Difference'},
    { key: 'differenceReason', header: 'Reason for Difference'},
    { key: 'remarks', header: 'Remarks'},
  ];

  if (records.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No records found.</p>
        <p className="text-sm">Submit the form to add a new record to Firestore.</p>
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
            <Select value={annexFilter} onValueChange={setAnnexFilter}>
                <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Filter by Annex..." />
                </SelectTrigger>
                <SelectContent>
                    {annexOptions.map(annex => (
                        <SelectItem key={annex} value={annex}>
                            {annex === 'all' ? 'All Annexes' : annex}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                    Kolom <ChevronDown className="ml-2 h-4 w-4" />
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
        <div className="border rounded-md">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                {columnDefs.filter(c => columnVisibility[c.key]).map(col => (
                    <TableHead key={col.key} className="cursor-pointer border-r last:border-r-0" onClick={() => handleSort(col.key)}>
                        <div className="flex items-center">{col.header} {renderSortIcon(col.key)}</div>
                    </TableHead>
                ))}
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedRecords.map((record) => (
                <TableRow key={record.id}>
                  {columnDefs.filter(c => columnVisibility[c.key]).map(col => (
                     <TableCell key={col.key} className="break-words border-r last:border-r-0 align-top">
                        {(() => {
                            const value = record[col.key] as string | undefined;
                             const isLongText = ['annex', 'standardPractice', 'legislationReference', 'isiUsulan', 'differenceText', 'differenceReason', 'remarks'].includes(col.key);
                             const content = (
                                <>
                                {col.key === 'status' && value ? (
                                    <Badge
                                    variant={value === 'Final' ? 'default' : value === 'Draft' ? 'secondary' : 'outline'}
                                    className={cn({'bg-emerald-500/80 text-white': value === 'Final'})}
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
                                        <p>{value}</p>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-md"><p>{value}</p></TooltipContent>
                                </Tooltip>
                                );
                             }
                             return content;
                        })()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right align-top">
                    <div className="flex justify-end gap-2">
                       <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" disabled>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Edit Record (coming soon)</p></TooltipContent>
                       </Tooltip>
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

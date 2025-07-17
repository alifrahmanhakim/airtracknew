
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
import { cn } from '@/lib/utils';
import { EditCcefodRecordDialog } from './edit-ccefod-record-dialog';
import { CcefodRecordDetailDialog } from './ccefod-record-detail-dialog';


type CcefodRecordsTableProps = {
  records: CcefodRecord[];
  onDelete: (record: CcefodRecord) => void;
  onUpdate: (updatedRecord: CcefodRecord) => void;
};

type SortDescriptor = {
    column: keyof CcefodRecord;
    direction: 'asc' | 'desc';
} | null;

export function CcefodRecordsTable({ records, onDelete, onUpdate }: CcefodRecordsTableProps) {
  const [sort, setSort] = useState<SortDescriptor>({ column: 'createdAt', direction: 'desc' });
  const [recordToView, setRecordToView] = useState<CcefodRecord | null>(null);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    id: false,
    createdAt: false,
    adaPerubahan: true,
    usulanPerubahan: false,
    isiUsulan: false,
    annex: true,
    annexReference: true,
    standardPractice: true,
    legislationReference: true,
    implementationLevel: true,
    differenceText: false,
    differenceReason: false,
    remarks: false,
    status: true
  });

  const sortedRecords = useMemo(() => {
    let sortedData = [...records];
    if (sort) {
        sortedData.sort((a, b) => {
            const aVal = a[sort.column as keyof CcefodRecord] ?? '';
            const bVal = b[sort.column as keyof CcefodRecord] ?? '';
            
            if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return sortedData;
  }, [records, sort]);

  const handleSort = (column: keyof CcefodRecord) => {
    setSort(prevSort => {
        if (prevSort?.column === column) {
            return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { column, direction: 'asc' };
    });
  };

  const renderSortIcon = (column: keyof CcefodRecord) => {
      if (sort?.column !== column) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
      return sort.direction === 'asc' ? <ArrowUpDown className="h-4 w-4 ml-2" /> : <ArrowUpDown className="h-4 w-4 ml-2" />;
  };
  
  const columnDefs: { key: keyof CcefodRecord; header: string; width?: string }[] = [
    { key: 'annex', header: 'Annex' },
    { key: 'annexReference', header: 'Annex Ref.' },
    { key: 'standardPractice', header: 'Standard/Practice' },
    { key: 'legislationReference', header: 'Legislation' },
    { key: 'implementationLevel', header: 'Implementation Level'},
    { key: 'status', header: 'Status' },
    { key: 'adaPerubahan', header: 'Ada Perubahan?'},
    { key: 'usulanPerubahan', header: 'Usulan Perubahan'},
    { key: 'isiUsulan', header: 'Isi Usulan'},
    { key: 'differenceText', header: 'Text of Difference'},
    { key: 'differenceReason', header: 'Reason for Difference'},
    { key: 'remarks', header: 'Remarks'},
  ];

  const visibleColumns = columnDefs.filter(c => columnVisibility[c.key]);

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
      <div className="space-y-4">
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="sm:ml-auto w-full sm:w-auto">
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
        <div className="border rounded-md overflow-auto">
          <Table className="min-w-[1600px]">
            <TableHeader className="sticky top-0 bg-background/95 z-10">
              <TableRow>
                {visibleColumns.map((col) => (
                    <TableHead 
                        key={col.key} 
                        className={cn("cursor-pointer align-middle", col.key === 'standardPractice' && 'w-[600px]')} 
                        onClick={() => handleSort(col.key as keyof CcefodRecord)}>
                        <div className="flex items-center">{col.header} {renderSortIcon(col.key as keyof CcefodRecord)}</div>
                    </TableHead>
                ))}
                <TableHead className="text-right sticky right-0 bg-background/95 z-10 w-[100px] align-middle">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecords.map((record) => (
                <TableRow 
                    key={record.id} 
                    className="cursor-pointer" 
                    onClick={() => setRecordToView(record)}
                >
                    {visibleColumns.map((col) => {
                        const isRichText = col.key === 'standardPractice';
                        return (
                            <TableCell key={col.key} className="align-middle">
                                {(() => {
                                    const value = record[col.key as keyof CcefodRecord] as string | undefined;
                                    
                                    if (isRichText && value) {
                                        return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: value }} />;
                                    }
                                    
                                    if (value === null || value === undefined || value === '') {
                                        return <span className='text-muted-foreground'>—</span>;
                                    }

                                    if (col.key === 'status') {
                                        return <Badge className={cn({
                                            'bg-green-100 text-green-800 hover:bg-green-200': value === 'Final',
                                            'bg-yellow-100 text-yellow-800 hover:bg-yellow-200': value === 'Draft',
                                            'bg-secondary text-secondary-foreground hover:bg-secondary/80': value === 'Existing',
                                        })}>{value}</Badge>;
                                    }

                                    return <div>{value}</div>;
                                })()}
                            </TableCell>
                        )
                    })}
                    <TableCell className="text-right sticky right-0 bg-background/95 z-10 align-middle">
                        <div className="flex justify-end gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                            <EditCcefodRecordDialog record={record} onRecordUpdate={onUpdate} />
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
          {sortedRecords.length === 0 && (
            <div className="text-center p-6 text-muted-foreground">
                <p>No matching records found.</p>
            </div>
          )}
        </div>
      </div>
      {recordToView && (
        <CcefodRecordDetailDialog 
            record={recordToView}
            open={!!recordToView}
            onOpenChange={(open) => { if(!open) setRecordToView(null) }}
        />
      )}
    </TooltipProvider>
  );
}

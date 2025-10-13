

'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { KnktReport } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Info, Pencil, Trash2, Link as LinkIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { EditKnktReportDialog } from './edit-knkt-report-dialog';
import { Highlight } from '../ui/highlight';

type KnktReportsTableProps = {
  records: KnktReport[];
  onUpdate: (record: KnktReport) => void;
  onDelete: (record: KnktReport) => void;
  searchTerm: string;
};

type SortDescriptor = {
    column: keyof KnktReport;
    direction: 'asc' | 'desc';
} | null;

export function KnktReportsTable({ records, onUpdate, onDelete, searchTerm }: KnktReportsTableProps) {
    const [sort, setSort] = React.useState<SortDescriptor>({ column: 'tanggal_diterbitkan', direction: 'desc' });

    const handleSort = (column: keyof KnktReport) => {
        setSort(prevSort => {
            if (prevSort?.column === column) {
                return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { column, direction: 'asc' };
        });
    };

    const renderSortIcon = (column: keyof KnktReport) => {
        if (sort?.column !== column) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
        return sort.direction === 'asc' ? <ArrowUpDown className="h-4 w-4 ml-2" /> : <ArrowUpDown className="h-4 w-4 ml-2" />;
    };

    const getStatusVariant = (status: string) => {
        if (status.toLowerCase().includes('final')) return 'default';
        if (status.toLowerCase().includes('preliminary')) return 'secondary';
        if (status.toLowerCase().includes('interim')) return 'outline';
        return 'secondary';
    }

    const sortedRecords = React.useMemo(() => {
        let sorted = [...records];
        if (sort) {
            sorted.sort((a, b) => {
                const aVal = a[sort.column];
                const bVal = b[sort.column];
                
                if (sort.column === 'tanggal_diterbitkan') {
                    return sort.direction === 'asc' 
                        ? new Date(aVal).getTime() - new Date(bVal).getTime()
                        : new Date(bVal).getTime() - new Date(aVal).getTime();
                }

                if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return sorted;
    }, [records, sort]);

    return (
        <div className="border rounded-md w-full overflow-x-auto">
            <Table className="table-fixed">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[10%] cursor-pointer text-left" onClick={() => handleSort('tanggal_diterbitkan')}><div className="flex items-center">Tgl Diterbitkan {renderSortIcon('tanggal_diterbitkan')}</div></TableHead>
                        <TableHead className="w-[15%] text-left">Nomor Laporan</TableHead>
                        <TableHead className="w-[12%] text-left">Status</TableHead>
                        <TableHead className="w-[13%] text-left">Operator</TableHead>
                        <TableHead className="w-[10%] text-left">Registrasi</TableHead>
                        <TableHead className="w-[10%] text-left">Tipe Pesawat</TableHead>
                        <TableHead className="w-[10%] text-left">Lokasi</TableHead>
                        <TableHead className="w-[20%] text-left">Keterangan</TableHead>
                        <TableHead className="w-[5%] text-left">File</TableHead>
                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedRecords.length > 0 ? sortedRecords.map((record) => (
                        <TableRow key={record.id}>
                            <TableCell className="align-top text-left break-words"><Highlight text={format(parseISO(record.tanggal_diterbitkan), 'dd-MMM-yy')} query={searchTerm}/></TableCell>
                            <TableCell className="align-top text-left break-words"><Highlight text={record.nomor_laporan} query={searchTerm}/></TableCell>
                            <TableCell className="align-top text-left break-words">
                                <div className="flex justify-center">
                                    <Badge variant={getStatusVariant(record.status)} className={cn(
                                        'text-xs',
                                        getStatusVariant(record.status) === 'default' && 'bg-blue-100 text-blue-800'
                                    )}>
                                        <Highlight text={record.status} query={searchTerm}/>
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell className="align-top text-left break-words"><Highlight text={record.operator} query={searchTerm}/></TableCell>
                            <TableCell className="align-top text-left break-words"><Highlight text={record.registrasi} query={searchTerm}/></TableCell>
                            <TableCell className="align-top text-left break-words"><Highlight text={record.tipe_pesawat} query={searchTerm}/></TableCell>
                            <TableCell className="align-top text-left break-words"><Highlight text={record.lokasi} query={searchTerm}/></TableCell>
                            <TableCell className="align-top text-left break-words">
                               <Highlight text={record.keterangan || '-'} query={searchTerm} />
                            </TableCell>
                            <TableCell className="align-middle text-center">
                                {record.fileUrl ? (
                                    <Button asChild variant="ghost" size="icon" className="h-6 w-6">
                                        <a href={record.fileUrl} target="_blank" rel="noopener noreferrer">
                                            <LinkIcon className="h-4 w-4" />
                                        </a>
                                    </Button>
                                ) : (
                                    <span className="text-muted-foreground text-xs">No file</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right align-top">
                                <div className="flex justify-end gap-0">
                                    <EditKnktReportDialog record={record} onRecordUpdate={onUpdate} />
                                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => onDelete(record)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={10} className="text-center h-24">
                                <Info className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                                No records found for the current filters.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

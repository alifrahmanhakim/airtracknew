
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
import { ArrowUpDown, Info, Pencil, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { EditKnktReportDialog } from './edit-knkt-report-dialog';

type KnktReportsTableProps = {
  records: KnktReport[];
  onUpdate: (record: KnktReport) => void;
  onDelete: (record: KnktReport) => void;
};

type SortDescriptor = {
    column: keyof KnktReport;
    direction: 'asc' | 'desc';
} | null;

export function KnktReportsTable({ records, onUpdate, onDelete }: KnktReportsTableProps) {
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
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('tanggal_diterbitkan')}><div className="flex items-center">Tgl Diterbitkan {renderSortIcon('tanggal_diterbitkan')}</div></TableHead>
                        <TableHead>Nomor Laporan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Registrasi</TableHead>
                        <TableHead>Tipe Pesawat</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedRecords.length > 0 ? sortedRecords.map((record) => (
                        <TableRow key={record.id}>
                            <TableCell>{format(parseISO(record.tanggal_diterbitkan), 'dd-MMM-yy')}</TableCell>
                            <TableCell>{record.nomor_laporan}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(record.status)} className={cn(
                                    getStatusVariant(record.status) === 'default' && 'bg-blue-100 text-blue-800'
                                )}>
                                    {record.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{record.operator}</TableCell>
                            <TableCell>{record.registrasi}</TableCell>
                            <TableCell>{record.tipe_pesawat}</TableCell>
                            <TableCell>{record.lokasi}</TableCell>
                            <TableCell className="text-right">
                                <EditKnktReportDialog record={record} onRecordUpdate={onUpdate} />
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(record)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center h-24">
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

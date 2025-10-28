
'use client';

import * as React from 'react';
import type { RulemakingRecord, Stage } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Info, ArrowUpDown } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { format, parseISO } from 'date-fns';
import { EditRulemakingRecordDialog } from './edit-rulemaking-record-dialog';
import { cn } from '@/lib/utils';
import { Highlight } from '../ui/highlight';

type RulemakingTableProps = {
  records: RulemakingRecord[];
  onDelete: (record: RulemakingRecord) => void;
  isLoading: boolean;
  onUpdate: (record: RulemakingRecord) => void;
  searchTerm: string;
  sort: SortDescriptor;
  setSort: (sort: SortDescriptor) => void;
};

type SortDescriptor = {
    column: keyof RulemakingRecord | 'firstSubmissionDate';
    direction: 'asc' | 'desc';
} | null;

const BulletList = ({ text, searchTerm }: { text: string; searchTerm: string }) => {
    if (!text) return null;
    
    const items = text.split(/\n\s*\n/).filter(item => item.trim() !== '');

    const renderItemWithPercentage = (itemText: string) => {
        const regex = /\((\d{1,3})%\)/;
        const match = itemText.match(regex);

        if (!match) {
            return <Highlight text={itemText.trim()} query={searchTerm} />;
        }

        const percentage = parseInt(match[1], 10);
        const textWithoutPercentage = itemText.replace(regex, '').trim();

        let colorClass = '';
        if (percentage <= 30) {
            colorClass = 'text-red-600 dark:text-red-400';
        } else if (percentage <= 50) {
            colorClass = 'text-yellow-600 dark:text-yellow-400';
        } else {
            colorClass = 'text-green-600 dark:text-green-400';
        }

        return (
            <>
                <Highlight text={textWithoutPercentage} query={searchTerm} />{' '}
                <span className={cn('font-bold', colorClass)}>
                    ({percentage}%)
                </span>
            </>
        );
    };
    
    if (items.length <= 1 && !/\n\s*\n/.test(text)) {
        return <p className="whitespace-pre-wrap">{renderItemWithPercentage(text)}</p>;
    }

    return (
      <ul className="list-disc list-inside space-y-1">
        {items.map((item, index) => (
          <li key={index}>{renderItemWithPercentage(item)}</li>
        ))}
      </ul>
    );
};

export function RulemakingTable({ records, onDelete, isLoading, onUpdate, searchTerm, sort, setSort }: RulemakingTableProps) {
  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }
  
  if (records.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No Records Found</p>
        <p className="text-sm">Use the form to add a new rulemaking record, or adjust your filters.</p>
      </div>
    );
  }
  
  const handleSort = (column: keyof RulemakingRecord | 'firstSubmissionDate') => {
    setSort(prevSort => {
        if (prevSort?.column === column) {
            return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { column, direction: 'asc' };
    });
  };

  const renderSortIcon = (column: keyof RulemakingRecord | 'firstSubmissionDate') => {
      if (sort?.column !== column) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
      return sort.direction === 'asc' ? <ArrowUpDown className="h-4 w-4 ml-2" /> : <ArrowUpDown className="h-4 w-4 ml-2" />;
  };

  const getKeteranganColor = (text: string | undefined) => {
    if (!text) return '';
    const lowerText = text.toLowerCase();
    if (lowerText.includes('pengajuan kembali')) {
        return 'text-yellow-600 dark:text-yellow-400 font-semibold';
    }
    if (lowerText.includes('pengajuan awal')) {
        return 'text-blue-600 dark:text-blue-400 font-semibold';
    }
    return 'text-muted-foreground';
  }

  const renderStage = (stage: Stage, index: number) => (
    <div key={index} className="border-b last:border-b-0 py-2">
       <div className="font-semibold mb-1">
          {stage.pengajuan.tanggal && (
            <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300">{format(parseISO(stage.pengajuan.tanggal), 'dd MMM yyyy')}</Badge>
          )}
          {stage.pengajuan.nomor && <p className="text-sm mt-1"><Highlight text={stage.pengajuan.nomor} query={searchTerm} /></p>}
          {stage.pengajuan.keteranganPengajuan && <p className={cn("text-sm mt-1", getKeteranganColor(stage.pengajuan.keteranganPengajuan))}><Highlight text={stage.pengajuan.keteranganPengajuan} query={searchTerm} /></p>}
      </div>
      <div className="text-sm mt-2">
        <strong className="text-muted-foreground">Status:</strong>
        <div className="pl-2">
          <BulletList text={stage.status.deskripsi} searchTerm={searchTerm} />
        </div>
      </div>
      {stage.keterangan?.text && (
        <div className="text-sm mt-1">
            <strong className="text-muted-foreground">Keterangan:</strong>
            <div className="pl-2">
                <BulletList text={stage.keterangan.text} searchTerm={searchTerm} />
            </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[5%]">No</TableHead>
            <TableHead className="w-[20%] cursor-pointer" onClick={() => handleSort('perihal')}>
                <div className="flex items-center">Perihal {renderSortIcon('perihal')}</div>
            </TableHead>
            <TableHead className="w-[15%] cursor-pointer" onClick={() => handleSort('kategori')}>
                <div className="flex items-center">Kategori {renderSortIcon('kategori')}</div>
            </TableHead>
            <TableHead className="w-[50%] cursor-pointer" onClick={() => handleSort('firstSubmissionDate')}>
                <div className="flex items-center">Pengajuan {renderSortIcon('firstSubmissionDate')}</div>
            </TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => (
            <TableRow key={record.id}>
              <TableCell className="align-top">{index + 1}</TableCell>
              <TableCell className="align-top font-medium"><Highlight text={record.perihal} query={searchTerm} /></TableCell>
              <TableCell className="align-top">
                <Badge
                  className={cn({
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200': record.kategori === 'PKPS/CASR',
                    'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200': record.kategori === 'SI',
                    'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300 border-pink-200': record.kategori === 'AC',
                  })}
                >
                  <Highlight text={record.kategori} query={searchTerm} />
                </Badge>
              </TableCell>
              <TableCell className="align-top">
                <div className="space-y-2">
                  {(record.stages || []).map((stage, i) => renderStage(stage, i))}
                </div>
              </TableCell>
              <TableCell className="text-right align-top">
                <div className="flex justify-end gap-1">
                  <EditRulemakingRecordDialog record={record} onRecordUpdate={onUpdate} />
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(record)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


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
import { Pencil, Trash2, Info, ArrowUpDown, Link as LinkIcon, FileText, Calendar, MessageSquare, ChevronDown } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { EditRulemakingRecordDialog } from './edit-rulemaking-record-dialog';
import { cn } from '@/lib/utils';
import { Highlight } from '../ui/highlight';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

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
  const [recordToEdit, setRecordToEdit] = React.useState<RulemakingRecord | null>(null);

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
  
  const formatUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }
    return url;
  };
  
  const renderStage = (stage: Stage, index: number, isLast: boolean) => {
    const statusColor = stage.status.deskripsi.toLowerCase().includes('selesai') ? 'border-green-500 bg-green-50 dark:bg-green-950' : 
                        stage.status.deskripsi.toLowerCase().includes('dikembalikan') ? 'border-red-500 bg-red-50 dark:bg-red-950' :
                        'border-border';
    return (
        <Card key={index} className={cn("relative", isLast ? statusColor : '')}>
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base">
                            {stage.pengajuan.tanggal && isValid(parseISO(stage.pengajuan.tanggal)) ? format(parseISO(stage.pengajuan.tanggal), 'dd MMM yyyy') : 'No Date'}
                        </CardTitle>
                        <CardDescription className={cn(getKeteranganColor(stage.pengajuan.keteranganPengajuan))}>
                             <Highlight text={stage.pengajuan.keteranganPengajuan || 'No Submission Info'} query={searchTerm} />
                        </CardDescription>
                    </div>
                    {stage.pengajuan.fileUrl && (
                        <Button asChild variant="outline" size="sm" className="h-8" onClick={(e) => e.stopPropagation()}>
                            <a href={formatUrl(stage.pengajuan.fileUrl)} target="_blank" rel="noopener noreferrer" >
                                <LinkIcon className="mr-2 h-3.5 w-3.5" /> View Attachment
                            </a>
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
                 {stage.pengajuan.nomor && 
                    <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                            <p className="font-semibold text-muted-foreground">Nomor Surat</p>
                            <p><Highlight text={stage.pengajuan.nomor} query={searchTerm} /></p>
                        </div>
                    </div>
                 }
                <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                        <p className="font-semibold text-muted-foreground">Deskripsi Status</p>
                        <BulletList text={stage.status.deskripsi} searchTerm={searchTerm} />
                    </div>
                </div>
                {stage.keterangan?.text && (
                    <div className="flex items-start gap-2">
                         <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                             <p className="font-semibold text-muted-foreground">Keterangan</p>
                             <BulletList text={stage.keterangan.text} searchTerm={searchTerm} />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
  )};

  return (
    <>
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[5%]">No</TableHead>
            <TableHead className="w-[25%] cursor-pointer" onClick={() => handleSort('perihal')}>
                <div className="flex items-center">Perihal {renderSortIcon('perihal')}</div>
            </TableHead>
            <TableHead className="w-[15%] cursor-pointer" onClick={() => handleSort('kategori')}>
                <div className="flex items-center">Kategori {renderSortIcon('kategori')}</div>
            </TableHead>
            <TableHead className="w-[55%] cursor-pointer" onClick={() => handleSort('firstSubmissionDate')}>
                <div className="flex items-center">Status & Timeline {renderSortIcon('firstSubmissionDate')}</div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => {
            const sortedStages = [...(record.stages || [])].sort((a,b) => {
                const dateA = a.pengajuan.tanggal ? parseISO(a.pengajuan.tanggal).getTime() : 0;
                const dateB = b.pengajuan.tanggal ? parseISO(b.pengajuan.tanggal).getTime() : 0;
                return dateB - dateA;
            });
            return (
            <TableRow key={record.id} className="align-top">
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">
                <div className="flex flex-col gap-2">
                    <Highlight text={record.perihal} query={searchTerm} />
                    <div className="flex items-center gap-2">
                        <EditRulemakingRecordDialog
                            record={record}
                            onRecordUpdate={onUpdate}
                            onDelete={onDelete}
                            open={recordToEdit?.id === record.id}
                            onOpenChange={(open) => setRecordToEdit(open ? record : null)}
                        />
                         <Button variant="destructive" size="sm" onClick={(e) => {e.stopPropagation(); onDelete(record);}}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    </div>
                </div>
              </TableCell>
              <TableCell>
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
              <TableCell>
                <div className="space-y-4 relative">
                   {sortedStages.map((stage, i) => (
                    <div key={stage.pengajuan.nomor || i} className="relative pl-6">
                      {i < sortedStages.length -1 && <div className="absolute left-[7px] top-4 h-full border-l-2 border-dashed border-primary" />}
                       <div className="absolute left-0 top-3 h-4 w-4 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                       </div>
                      <div className="ml-4">
                        {renderStage(stage, i, i === 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    </div>
    </>
  );
}

    
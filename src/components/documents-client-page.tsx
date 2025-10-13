
'use client';

import * as React from 'react';
import type { Project, Document as ProjectDocument, Task, Attachment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { FileText, FileSpreadsheet, FileImage, FileQuestion, File, Link as LinkIcon, Search, Folder, Info, GanttChartSquare } from 'lucide-react';
import Link from 'next/link';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

type LinkedFile = {
  id: string;
  name: string;
  url: string;
  type: ProjectDocument['type'];
  date: string;
  projectId: string;
  projectName: string;
  projectType: Project['projectType'];
  source: 'Project' | 'Task';
  taskTitle?: string;
};

const ITEMS_PER_PAGE = 10;

const getFileExtension = (url: string) => {
    try {
    const pathname = new URL(url).pathname;
    const extension = pathname.split('.').pop()?.toLowerCase();
    return extension;
    } catch (e) {
    return 'other';
    }
};

const determineFileType = (url: string): ProjectDocument['type'] => {
    const extension = getFileExtension(url);
    if (!extension) return 'Other';

    if (extension === 'pdf') return 'PDF';
    if (['doc', 'docx'].includes(extension)) return 'Word';
    if (['xls', 'xlsx', 'csv'].includes(extension)) return 'Excel';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) return 'Image';
    
    return 'Other';
};


const getDocumentIcon = (type: ProjectDocument['type']) => {
    switch (type) {
      case 'PDF':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'Word':
        return <File className="h-5 w-5 text-blue-500" />;
      case 'Excel':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'Image':
        return <FileImage className="h-5 w-5 text-purple-500" />;
      default:
        return <FileQuestion className="h-5 w-5 text-gray-500" />;
    }
};

type DocumentsClientPageProps = {
    initialFiles: LinkedFile[];
}

export function DocumentsClientPage({ initialFiles }: DocumentsClientPageProps) {
  const [filter, setFilter] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);

  const filteredFiles = React.useMemo(() => {
    if (!filter) return initialFiles;
    const lowercasedFilter = filter.toLowerCase();
    return initialFiles.filter(file => 
      file.name.toLowerCase().includes(lowercasedFilter) ||
      file.projectName.toLowerCase().includes(lowercasedFilter) ||
      file.taskTitle?.toLowerCase().includes(lowercasedFilter)
    );
  }, [initialFiles, filter]);

  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);
  const paginatedFiles = filteredFiles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderContent = () => {
    if (initialFiles.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
                <Info className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">No Documents Found</p>
                <p className="text-sm">No documents or attachments have been linked to any projects or tasks yet.</p>
            </div>
        );
    }

    return (
      <>
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by file, project, or task name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="text-right">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFiles.length > 0 ? paginatedFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{getDocumentIcon(file.type)}</TableCell>
                  <TableCell className="font-medium">{file.name}</TableCell>
                  <TableCell>
                    <Link href={`/projects/${file.projectId}?type=${file.projectType === 'Rulemaking' ? 'rulemaking' : 'timkerja'}`} className="flex flex-col group">
                        <div className="flex items-center gap-2 group-hover:underline text-primary">
                            <Folder className="h-4 w-4" />
                            <span className="break-words">{file.projectName}</span>
                        </div>
                        {file.taskTitle && (
                            <div className="flex items-center gap-2 pl-6 text-muted-foreground text-xs">
                                <GanttChartSquare className="h-3 w-3" />
                                <span className="break-words">{file.taskTitle}</span>
                            </div>
                        )}
                    </Link>
                  </TableCell>
                  <TableCell>{format(parseISO(file.date), 'PPP')}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                        No documents match your search.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <Pagination className="mt-4">
            <PaginationContent>
            <PaginationItem>
                <PaginationPrevious 
                href="#" 
                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} 
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''} 
                />
            </PaginationItem>
            <PaginationItem>
                <span className="px-4 py-2 text-sm">
                Page {currentPage} of {totalPages}
                </span>
            </PaginationItem>
            <PaginationItem>
                <PaginationNext 
                href="#" 
                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
            </PaginationItem>
            </PaginationContent>
        </Pagination>
      </>
    );
  };


  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Document Repository</CardTitle>
          <CardDescription>
            A centralized list of all documents and attachments linked across all projects and tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}


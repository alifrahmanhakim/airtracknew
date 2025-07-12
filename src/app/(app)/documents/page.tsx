
'use client';

import * as React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, Document as ProjectDocument } from '@/lib/types';
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
import { FileText, FileSpreadsheet, FileImage, FileQuestion, File, Link as LinkIcon, Search, Folder, Info } from 'lucide-react';
import Link from 'next/link';

type EnhancedDocument = ProjectDocument & {
  projectId: string;
  projectName: string;
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

export default function DocumentsPage() {
  const [allDocuments, setAllDocuments] = React.useState<EnhancedDocument[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('');

  React.useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        
        const documents: EnhancedDocument[] = [];
        projects.forEach(project => {
          if (project.documents && project.documents.length > 0) {
            project.documents.forEach(doc => {
              documents.push({
                ...doc,
                projectId: project.id,
                projectName: project.name,
              });
            });
          }
        });
        
        // Sort by upload date descending
        documents.sort((a, b) => parseISO(b.uploadDate).getTime() - parseISO(a.uploadDate).getTime());
        setAllDocuments(documents);

      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const filteredDocuments = React.useMemo(() => {
    if (!filter) return allDocuments;
    const lowercasedFilter = filter.toLowerCase();
    return allDocuments.filter(doc => 
      doc.name.toLowerCase().includes(lowercasedFilter) ||
      doc.projectName.toLowerCase().includes(lowercasedFilter)
    );
  }, [allDocuments, filter]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-2">
              <Skeleton className="h-8 w-8" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (allDocuments.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
                <Info className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">No Documents Found</p>
                <p className="text-sm">No documents have been linked to any projects yet.</p>
            </div>
        );
    }

    return (
      <>
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by document or project name..."
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
                <TableHead>Document Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="text-right">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length > 0 ? filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{getDocumentIcon(doc.type)}</TableCell>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell>
                    <Link href={`/projects/${doc.projectId}`} className="flex items-center gap-2 hover:underline text-muted-foreground hover:text-primary">
                        <Folder className="h-4 w-4" />
                        {doc.projectName}
                    </Link>
                  </TableCell>
                  <TableCell>{format(parseISO(doc.uploadDate), 'PPP')}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
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
      </>
    );
  };


  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Document Repository</CardTitle>
          <CardDescription>
            A centralized list of all documents linked across all projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}

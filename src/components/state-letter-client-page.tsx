
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { GapAnalysisRecord, Project, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { deleteGapAnalysisRecord } from '@/lib/actions/gap-analysis';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle, Mail, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GapAnalysisForm } from '@/components/gap-analysis-form';
import { GapAnalysisRecordsTable } from '@/components/gap-analysis-records-table';
import { GapAnalysisAnalyticsDashboard } from '@/components/gap-analysis-analytics-dashboard';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { createExportRecord } from '@/lib/actions/verification';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';

type StateLetterClientPageProps = {
    initialRecords: GapAnalysisRecord[];
    initialRulemakingProjects: Project[];
}

export function StateLetterClientPage({ initialRecords, initialRulemakingProjects }: StateLetterClientPageProps) {
  const [records, setRecords] = useState<GapAnalysisRecord[]>(initialRecords);
  const [rulemakingProjects, setRulemakingProjects] = useState<Project[]>(initialRulemakingProjects);
  const [activeTab, setActiveTab] = useState('records');
  const { toast } = useToast();
  const router = useRouter();
  
  const [recordToDelete, setRecordToDelete] = useState<GapAnalysisRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [annexFilter, setAnnexFilter] = useState('all');
  const [casrFilter, setCasrFilter] = useState('all');
  const [textFilter, setTextFilter] = useState('');
  
  useEffect(() => {
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    if (loggedInUserId) {
        getDoc(doc(db, "users", loggedInUserId)).then(userSnap => {
            if (userSnap.exists()) {
                setCurrentUser({ id: userSnap.id, ...userSnap.data() } as User);
            }
        });
    }
  }, []);

  const resetFilters = () => {
    setStatusFilter('all');
    setAnnexFilter('all');
    setCasrFilter('all');
    setTextFilter('');
  };
  
  const annexOptions = useMemo(() => ['all', ...Array.from(new Set(records.map(r => r.annex).filter(Boolean)))], [records]);
  const casrOptions = useMemo(() => ['all', ...Array.from(new Set(records.flatMap(r => r.evaluations.map(e => e.casrAffected)))).sort()], [records]);
  
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const statusMatch = statusFilter === 'all' || record.statusItem === statusFilter;
      const annexMatch = annexFilter === 'all' || record.annex === annexFilter;
      const casrMatch = casrFilter === 'all' || record.evaluations.some(e => e.casrAffected === casrFilter);
      
      const textMatch = textFilter === '' || 
        Object.values(record).some(value =>
            String(value).toLowerCase().includes(textFilter.toLowerCase())
        ) ||
        record.evaluations.some(e => Object.values(e).some(val => String(val).toLowerCase().includes(textFilter.toLowerCase())));


      return statusMatch && annexMatch && casrMatch && textMatch;
    });
  }, [records, statusFilter, annexFilter, casrFilter, textFilter]);
  
  const handleDeleteRequest = (record: GapAnalysisRecord) => {
    setRecordToDelete(record);
  };
  
  const handleRecordAdd = () => {
    // The onSnapshot listener will automatically handle adding the record.
    setActiveTab('records');
    router.refresh();
  };
  
  const handleRecordUpdate = (updatedRecord: GapAnalysisRecord) => {
    setRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;

    setIsDeleting(true);
    const result = await deleteGapAnalysisRecord(recordToDelete.id);
    setIsDeleting(false);

    if (result.success) {
      toast({ title: "Record Deleted", description: "The State Letter record has been removed." });
      setRecords(prev => prev.filter(r => r.id !== recordToDelete.id));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setRecordToDelete(null);
  };
  
  const handleExportPdf = async () => {
    if (filteredRecords.length === 0) {
      toast({ variant: "destructive", title: "No Data", description: "There is no data to generate a PDF for." });
      return;
    }

    if (!currentUser) {
      toast({ variant: "destructive", title: "User not found", description: "Could not identify the current user." });
      return;
    }

    const exportRecord = await createExportRecord({
      documentType: 'GAP Analysis Records',
      exportedAt: new Date(),
      exportedBy: { id: currentUser.id, name: currentUser.name },
      filters: { statusFilter, annexFilter, casrFilter, textFilter },
    });

    if (!exportRecord.success || !exportRecord.id) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not create an export record for verification." });
      return;
    }

    const verificationUrl = `https://stdatabase.site/verify/${exportRecord.id}`;
    
    const logoUrl = 'https://ik.imagekit.io/avmxsiusm/LOGO-AIRTRACK%20black.png';
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = logoUrl;

    const generatePdf = async (logoDataUrl?: string) => {
        const doc = new jsPDF({ orientation: 'landscape' });
        
        const qrDataUrl = await QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H' });

        const tableColumn = ["SL Ref. Number", "Subject", "Type", "Status", "Evaluation Date", "Annex"];
        const tableRows = filteredRecords.map(record => [
            record.slReferenceNumber,
            record.subject,
            record.typeOfStateLetter,
            record.statusItem,
            record.dateOfEvaluation ? format(parseISO(record.dateOfEvaluation), 'dd-MMM-yy') : 'N/A',
            record.annex
        ]);
        
        const addPageContent = (data: { pageNumber: number }) => {
            const pageCount = (doc as any).internal.getNumberOfPages();
            
            doc.setFontSize(18);
            doc.text("GAP Analysis Records", 14, 20);
            
            if (logoDataUrl) {
                const aspectRatio = img.width / img.height;
                const logoWidth = 30;
                const logoHeight = aspectRatio > 0 ? logoWidth / aspectRatio : 0;
                if (logoHeight > 0) {
                    doc.addImage(logoDataUrl, 'PNG', doc.internal.pageSize.getWidth() - (logoWidth + 15), 8, logoWidth, logoHeight);
                }
            }

            const footerY = doc.internal.pageSize.height - 20;
            doc.setFontSize(8);
            doc.addImage(qrDataUrl, 'PNG', 14, footerY - 5, 15, 15);
            doc.text('Genuine Document by AirTrack', 14, footerY + 12);
            
            const copyrightText = `Copyright © AirTrack ${new Date().getFullYear()}`;
            doc.text(copyrightText, doc.internal.pageSize.width / 2, footerY + 12, { align: 'center' });
            
            doc.text(`Page ${data.pageNumber} of ${pageCount}`, doc.internal.pageSize.width - 14, footerY + 12, { align: 'right' });
        };
        
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
            didDrawPage: addPageContent,
            margin: { top: 30, bottom: 30 },
        });
        
        doc.save("gap_analysis_records.pdf");
    };

    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            generatePdf(); 
            return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        generatePdf(dataUrl);
    };

    img.onerror = () => {
        toast({ variant: "destructive", title: "Logo Error", description: "Could not load logo for PDF." });
        generatePdf();
    };
  };

  const renderContent = () => {
    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold flex items-center gap-2"><Mail /> State Letter</CardTitle>
                    <CardDescription className="mt-2">
                        Manage and monitor State Letter records.
                    </CardDescription>
                    <div className="pt-4">
                        <TabsList>
                          <TabsTrigger value="form">Input Form</TabsTrigger>
                          <TabsTrigger value="records">Records</TabsTrigger>
                          <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>
                    </div>
                </CardHeader>
            </Card>
            
            <TabsContent value="form" className={cn(activeTab !== 'form' ? 'hidden' : '')}>
                <Card>
                    <CardHeader>
                    <CardTitle>State Letter Form</CardTitle>
                    <CardDescription>
                        Fill out the form below to add a new analysis record.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <GapAnalysisForm onFormSubmit={handleRecordAdd} rulemakingProjects={rulemakingProjects} />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="records" className={cn(activeTab !== 'records' ? 'hidden' : '')}>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>State Letter Records</CardTitle>
                                <CardDescription>
                                    A list of all State Letter records from the database.
                                </CardDescription>
                            </div>
                            <Button variant="outline" onClick={handleExportPdf}>
                                <Printer className="mr-2 h-4 w-4" />
                                Export to PDF
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <GapAnalysisRecordsTable 
                            records={filteredRecords} 
                            onDelete={handleDeleteRequest} 
                            onUpdate={handleRecordUpdate}
                            filters={{ statusFilter, annexFilter, casrFilter, textFilter }}
                            setFilters={{ setStatusFilter, setAnnexFilter, setCasrFilter, setTextFilter }}
                            filterOptions={{ annexOptions, casrOptions }}
                            onResetFilters={resetFilters}
                        />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className={cn(activeTab !== 'analytics' ? 'hidden' : '')}>
                <Card>
                    <CardHeader>
                        <CardTitle>State Letter Analytics</CardTitle>
                        <CardDescription>
                            Visualizations of the State Letter data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <GapAnalysisAnalyticsDashboard records={filteredRecords} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
  }

  return (
    <div className="p-4 md:p-8">
       {renderContent()}
       
        <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader className="text-center items-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the record with SL Reference <span className="font-semibold">{recordToDelete?.slReferenceNumber}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

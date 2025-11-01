
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { LawEnforcementRecord, User } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, FileSpreadsheet, Printer } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { lawEnforcementFormSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { addLawEnforcementRecord } from '@/lib/actions/law-enforcement';
import * as XLSX from 'xlsx';
import { AppLayout } from '@/components/app-layout-component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createExportRecord } from '@/lib/actions/verification';
import QRCode from 'qrcode';

const LawEnforcementForm = dynamic(() => import('@/components/rsi/law-enforcement-form').then(mod => mod.LawEnforcementForm), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" /> 
});
const LawEnforcementTable = dynamic(() => import('@/components/rsi/law-enforcement-table').then(mod => mod.LawEnforcementTable), { 
    loading: () => <Skeleton className="h-[600px] w-full" /> 
});
const LawEnforcementAnalytics = dynamic(() => import('@/components/rsi/law-enforcement-analytics').then(mod => mod.LawEnforcementAnalytics), {
    loading: () => <Skeleton className="h-[600px] w-full" />
});

type LawEnforcementFormValues = z.infer<typeof lawEnforcementFormSchema>;

export default function LawEnforcementPage() {
    const [records, setRecords] = React.useState<LawEnforcementRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('records');
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);

    const form = useForm<LawEnforcementFormValues>({
        resolver: zodResolver(lawEnforcementFormSchema),
        defaultValues: {
            impositionType: 'aoc',
            references: [{ id: `ref-${Date.now()}`, sanctionType: '', refLetter: '', dateLetter: new Date(), fileUrl: '' }],
            sanctionedAoc: [{ value: '' }],
            sanctionedPersonnel: [{ value: '' }],
            sanctionedOrganization: [{ value: '' }],
        },
    });

    React.useEffect(() => {
        const q = query(collection(db, "lawEnforcementRecords"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const recordsFromDb: LawEnforcementRecord[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                recordsFromDb.push({ 
                    id: doc.id, 
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                 } as LawEnforcementRecord);
            });
            setRecords(recordsFromDb);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching records: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch data from the database.',
            });
            setIsLoading(false);
        });
        
        const loggedInUserId = localStorage.getItem('loggedInUserId');
        if (loggedInUserId) {
            getDoc(doc(db, "users", loggedInUserId)).then(userSnap => {
                if (userSnap.exists()) {
                    setCurrentUser({ id: userSnap.id, ...userSnap.data() } as User);
                }
            });
        }

        return () => unsubscribe();
    }, [toast]);

    const handleRecordUpdate = (updatedRecord: LawEnforcementRecord) => {
        setRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    };

    const handleFormSuccess = () => {
        setActiveTab('records');
    }
    
    const onSubmit = async (data: LawEnforcementFormValues) => {
        setIsSubmitting(true);
        const result = await addLawEnforcementRecord(data);
        setIsSubmitting(false);

        if (result.success) {
            toast({ title: 'Record Added', description: 'The new sanction record has been successfully added.' });
            form.reset({
                impositionType: 'aoc',
                references: [{ id: `ref-${Date.now()}`, sanctionType: '', refLetter: '', dateLetter: new Date(), fileUrl: '' }],
                sanctionedAoc: [{ value: '' }],
                sanctionedPersonnel: [],
                sanctionedOrganization: [],
            });
            handleFormSuccess();
        } else {
            toast({
                variant: 'destructive',
                title: 'Error Adding Record',
                description: result.error || 'An unknown error occurred.',
            });
        }
    };
    
    const handleExportExcel = () => {
        if (records.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Data to Export',
                description: 'There are no records to export.',
            });
            return;
        }

        const dataToExport = records.flatMap(record => {
            const sanctionedEntity = 
                record.impositionType === 'aoc' ? (record.sanctionedAoc?.map(s => s.value).join(', ') || '') :
                record.impositionType === 'personnel' ? (record.sanctionedPersonnel?.map(s => s.value).join(', ') || '') :
                (record.sanctionedOrganization?.map(s => s.value).join(', ') || '');
            
            return (record.references || []).map(ref => ({
                'Imposition Type': record.impositionType,
                'Sanctioned Entity': sanctionedEntity,
                'Sanction Type': ref.sanctionType,
                'Reference Letter': ref.refLetter,
                'Date Letter': ref.dateLetter,
                'File URL': ref.fileUrl || '',
                'Created At': record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '',
            }));
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Law Enforcement Records');
        XLSX.writeFile(workbook, 'law_enforcement_records.xlsx');
    };
    
    const handleExportPdf = async () => {
        if (records.length === 0) {
            toast({ variant: "destructive", title: "No Data", description: "There is no data to generate a PDF for." });
            return;
        }

        if (!currentUser) {
            toast({ variant: "destructive", title: "User not found", description: "Could not identify the current user." });
            return;
        }

        const exportRecord = await createExportRecord({
            documentType: 'List of Law Enforcement',
            exportedAt: new Date(),
            exportedBy: { id: currentUser.id, name: currentUser.name },
            filters: {},
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

        const generatePdfWithLogo = async (logoDataUrl?: string) => {
            const doc = new jsPDF({ orientation: 'landscape' });
            const qrDataUrl = await QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H' });
            
            const tableColumn = ["Imposition Type", "Sanctioned Entity", "References"];
            const tableRows = records.map(record => {
                 const sanctionedEntity = 
                    record.impositionType === 'aoc' ? (record.sanctionedAoc?.map(s => s.value).join('\n') || '') :
                    record.impositionType === 'personnel' ? (record.sanctionedPersonnel?.map(s => s.value).join('\n') || '') :
                    (record.sanctionedOrganization?.map(s => s.value).join('\n') || '');
                
                const references = (record.references || []).map(ref => 
                    `Type: ${ref.sanctionType}\nRef: ${ref.refLetter}\nDate: ${ref.dateLetter}${ref.fileUrl ? `\nLink: ${ref.fileUrl}` : ''}`
                ).join('\n\n');
                return [record.impositionType, sanctionedEntity, references];
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 25,
                theme: 'grid',
                headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
                didDrawPage: (data) => {
                    // Header
                    doc.setFontSize(16);
                    doc.text("Law Enforcement Records", 14, 20);
                    if (logoDataUrl) {
                        const aspectRatio = img.width / img.height;
                        const logoWidth = 30;
                        const logoHeight = aspectRatio > 0 ? logoWidth / aspectRatio : 0;
                        if(logoHeight > 0) doc.addImage(logoDataUrl, 'PNG', doc.internal.pageSize.getWidth() - 45, 8, logoWidth, logoHeight);
                    }
                },
                 margin: { top: 30, bottom: 30 },
            });
            
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                
                // Footer
                const footerY = doc.internal.pageSize.height - 20;
                doc.setFontSize(8);
                doc.addImage(qrDataUrl, 'PNG', 14, footerY - 5, 15, 15);
                doc.text('Genuine Document by AirTrack', 14, footerY + 12);
                const copyrightText = `Copyright © AirTrack ${new Date().getFullYear()}`;
                doc.text(copyrightText, doc.internal.pageSize.width / 2, footerY + 12, { align: 'center' });
                doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 14, footerY + 12, { align: 'right' });
            }
            
            doc.save("law_enforcement_records.pdf");
        };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                generatePdfWithLogo();
                return;
            }
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            generatePdfWithLogo(dataUrl);
        };
        
        img.onerror = () => {
             toast({ variant: "destructive", title: "Logo Error", description: "Could not load the logo image. PDF will be generated without it." });
             generatePdfWithLogo();
        }
    };


    return (
        <AppLayout>
            <main className="p-4 md:p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <Card className="mb-4">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <Button asChild variant="outline" size="icon" className="transition-all hover:-translate-x-1">
                                        <Link href="/rsi">
                                            <ArrowLeft className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <div>
                                        <h1 className="text-3xl font-bold">List of Law Enforcement</h1>
                                        <p className="text-muted-foreground mt-2">
                                            Manage and monitor law enforcement sanctions.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <TabsList>
                                <TabsTrigger value="form">Input Form</TabsTrigger>
                                <TabsTrigger value="records">Records</TabsTrigger>
                                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                            </TabsList>
                        </CardContent>
                    </Card>

                    <TabsContent value="form">
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Add New Sanction</CardTitle>
                                    <CardDescription>Fill out the form to add a new law enforcement record.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <LawEnforcementForm form={form} isSubmitting={isSubmitting} />
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit Record
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </TabsContent>

                    <TabsContent value="records">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>Sanction Records</CardTitle>
                                        <CardDescription>List of all law enforcement records.</CardDescription>
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <Button variant="outline" onClick={handleExportExcel}>
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                            Export to Excel
                                        </Button>
                                        <Button variant="outline" onClick={handleExportPdf}>
                                            <Printer className="mr-2 h-4 w-4" />
                                            Export to PDF
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <Skeleton className="h-[600px] w-full" />
                                ) : (
                                    <LawEnforcementTable records={records} onUpdate={handleRecordUpdate} />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="analytics">
                        <Card>
                            <CardHeader>
                                <CardTitle>Analytics</CardTitle>
                                <CardDescription>Visualizations of the law enforcement data.</CardDescription>
                            </CardHeader>
                            <CardContent>
                            <LawEnforcementAnalytics allRecords={records} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </AppLayout>
    );
}

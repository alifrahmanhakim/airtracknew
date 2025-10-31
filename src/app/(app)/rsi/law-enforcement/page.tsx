

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { LawEnforcementRecord } from '@/lib/types';
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

    const form = useForm<LawEnforcementFormValues>({
        resolver: zodResolver(lawEnforcementFormSchema),
        defaultValues: {
            impositionType: 'aoc',
            references: [{ id: `ref-${Date.now()}`, sanctionType: '', refLetter: '', dateLetter: new Date() }],
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
                references: [{ id: `ref-${Date.now()}`, sanctionType: '', refLetter: '', dateLetter: new Date() }],
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

        const dataToExport = records.map(record => {
            const sanctionedEntity = 
                record.impositionType === 'aoc' ? (record.sanctionedAoc?.map(s => s.value).join(', ') || '') :
                record.impositionType === 'personnel' ? (record.sanctionedPersonnel?.map(s => s.value).join(', ') || '') :
                (record.sanctionedOrganization?.map(s => s.value).join(', ') || '');
            
            const references = (record.references || []).map(ref => 
                `Type: ${ref.sanctionType}, Letter: ${ref.refLetter}, Date: ${ref.dateLetter}`
            ).join('; ');

            return {
                'Imposition Type': record.impositionType,
                'Sanctioned Entity': sanctionedEntity,
                'References': references,
                'Created At': record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '',
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Law Enforcement Records');
        XLSX.writeFile(workbook, 'law_enforcement_records.xlsx');
    };
    
    const handleExportPdf = () => {
        if (records.length === 0) {
            toast({ variant: "destructive", title: "No Data", description: "There is no data to generate a PDF for." });
            return;
        }
        const doc = new jsPDF();
        const logoUrl = 'https://ik.imagekit.io/avmxsiusm/LOGO-AIRTRACK%20black.png';

        const addPageContent = (pageNumber: number, pageCount: number) => {
            doc.setFontSize(18);
            doc.text("Law Enforcement Records", 14, 15);
            
            if(pageNumber === 1) {
              doc.addImage(logoUrl, 'PNG', doc.internal.pageSize.getWidth() - 45, 8, 30, 10);
            }
            
            doc.setFontSize(8);
            const copyrightText = `Copyright © AirTrack ${new Date().getFullYear()}`;
            const textWidth = doc.getStringUnitWidth(copyrightText) * doc.getFontSize() / doc.internal.scaleFactor;
            const textX = doc.internal.pageSize.width - textWidth - 14;
            doc.text(copyrightText, textX, doc.internal.pageSize.height - 10);

            const pageText = `Page ${pageNumber} of ${pageCount}`;
            doc.text(pageText, 14, doc.internal.pageSize.height - 10);
        };
        
        const tableColumn = ["Imposition Type", "Sanctioned Entity", "References"];
        const tableRows = records.map(record => {
             const sanctionedEntity = 
                record.impositionType === 'aoc' ? (record.sanctionedAoc?.map(s => s.value).join('\n') || '') :
                record.impositionType === 'personnel' ? (record.sanctionedPersonnel?.map(s => s.value).join('\n') || '') :
                (record.sanctionedOrganization?.map(s => s.value).join('\n') || '');
            
            const references = (record.references || []).map(ref => 
                `Type: ${ref.sanctionType}\nRef: ${ref.refLetter}\nDate: ${ref.dateLetter}`
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
                addPageContent(data.pageNumber, (doc as any).internal.getNumberOfPages());
            }
        });
        
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageText = `Page ${i} of ${pageCount}`;
            doc.setFontSize(8);
            doc.text(pageText, 14, doc.internal.pageSize.height - 10);
        }

        doc.save("law_enforcement_records.pdf");
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

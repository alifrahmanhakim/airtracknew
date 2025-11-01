
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, FileText, User, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type VerificationPageProps = {
  params: {
    id: string;
  };
};

type ExportDocument = {
    documentType: string;
    exportedAt: Timestamp;
    exportedBy: {
        id: string;
        name: string;
    };
    filters: Record<string, any>;
    createdAt: Timestamp;
}

async function getExportData(id: string): Promise<ExportDocument | null> {
    try {
        const docRef = doc(db, 'exportedDocuments', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as ExportDocument;
        }
        return null;
    } catch (error) {
        console.error("Error fetching verification data:", error);
        return null;
    }
}

export default async function VerificationPage({ params }: VerificationPageProps) {
    const { id } = params;
    const data = await getExportData(id);

    return (
        <main className="min-h-screen bg-muted/40 p-4 md:p-8 flex items-center justify-center">
            {data ? (
                <Card className="w-full max-w-2xl animate-fade-in-blur">
                    <CardHeader className="text-center items-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4 border-4 border-green-200">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">Document Verified</CardTitle>
                        <CardDescription>
                            This document was genuinely generated from the AirTrack system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground"><FileText className="h-4 w-4"/> Document Type</span>
                                <span className="font-semibold">{data.documentType}</span>
                            </div>
                            <div className="flex items-start justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4"/> Exported On</span>
                                <span className="font-semibold">{format(data.exportedAt.toDate(), 'PPP p')}</span>
                            </div>
                            <div className="flex items-start justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4"/> Exported By</span>
                                <span className="font-semibold">{data.exportedBy.name}</span>
                            </div>
                            <div className="flex items-start justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground"><Filter className="h-4 w-4"/> Filters Applied</span>
                                <div className='flex flex-wrap gap-1 justify-end'>
                                    {Object.entries(data.filters).map(([key, value]) => (
                                        <Badge key={key} variant="secondary">{key}: {String(value)}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Uncontrolled Copy</AlertTitle>
                            <AlertDescription>
                                This document is an uncontrolled copy. The most up-to-date and official version resides within the AirTrack application. Information may have changed since the export date.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            ) : (
                 <Card className="w-full max-w-2xl text-center">
                    <CardHeader className="items-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4 border-4 border-red-200">
                            <AlertTriangle className="h-10 w-10 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl text-destructive">Verification Failed</CardTitle>
                        <CardDescription>
                            The QR code is invalid, expired, or the document record could not be found.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Please ensure you are scanning a valid QR code from an officially exported document. If you believe this is an error, please contact the system administrator.
                        </p>
                        <Button asChild className="mt-6">
                            <Link href="/login">Return to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </main>
    );
}

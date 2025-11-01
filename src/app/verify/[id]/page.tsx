
'use client';

import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, FileText, User, Calendar, Filter, Loader2, Fingerprint } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

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

export default function VerificationPage() {
    const params = useParams();
    const id = params.id as string;
    const [data, setData] = useState<ExportDocument | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            setIsLoading(false);
            setData(null);
            return;
        };

        const getExportData = async (docId: string) => {
            setIsLoading(true);
            try {
                const docRef = doc(db, 'exportedDocuments', docId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setData(docSnap.data() as ExportDocument);
                } else {
                    setData(null);
                }
            } catch (error) {
                console.error("Error fetching verification data:", error);
                setData(null);
            } finally {
                setIsLoading(false);
            }
        };
        
        getExportData(id);

    }, [id]);

    if (isLoading || data === undefined) {
        return (
            <main className="min-h-screen bg-muted/40 p-4 md:p-8 flex items-center justify-center">
                 <Card className="w-full max-w-2xl text-center">
                    <CardContent className="p-12">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="font-semibold text-lg">Verifying document...</p>
                            <p className="text-muted-foreground">Please wait while we check the document's authenticity.</p>
                        </div>
                    </CardContent>
                </Card>
            </main>
        )
    }

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
                                <span className="flex items-center gap-2 text-muted-foreground"><Fingerprint className="h-4 w-4"/> Document ID</span>
                                <span className="font-mono text-xs bg-muted p-1 rounded-md">{id}</span>
                            </div>
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
                            {Object.keys(data.filters).length > 0 && (
                                <div className="flex items-start justify-between">
                                    <span className="flex items-center gap-2 text-muted-foreground"><Filter className="h-4 w-4"/> Filters Applied</span>
                                    <div className='flex flex-wrap gap-1 justify-end'>
                                        {Object.entries(data.filters).map(([key, value]) => (
                                            <Badge key={key} variant="secondary">{key}: {String(value)}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                             <Alert variant="destructive" className="mt-6">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Uncontrolled Copy</AlertTitle>
                                <AlertDescription>
                                    This document is an uncontrolled copy. The most up-to-date and official version resides within the AirTrack application. Information may have changed since the export date.
                                </AlertDescription>
                            </Alert>
                             <div className="flex justify-center mt-6">
                                <div className="relative w-64 h-64">
                                    <Image
                                        src="https://ik.imagekit.io/avmxsiusm/Untitled-2%20(1).webp"
                                        alt="Genuine Document Stamp"
                                        fill
                                        sizes="256px"
                                        className="opacity-80 object-contain"
                                    />
                                </div>
                            </div>
                        </div>
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

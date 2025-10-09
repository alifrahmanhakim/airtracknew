
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MonitoringRekomendasiPage() {
    const { toast } = useToast();
    
    // Placeholder function until backend is implemented
    const ComingSoon = () => (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-96">
        <h2 className="text-2xl font-bold">Coming Soon!</h2>
        <p className="text-muted-foreground mt-2">
          This feature is currently under construction.
        </p>
      </div>
    );

    return (
        <main className="p-4 md:p-8">
             <Tabs defaultValue="records" className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="icon">
                            <Link href="/rsi">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div className="p-4 rounded-lg bg-card/80 backdrop-blur-sm">
                            <h1 className="text-3xl font-bold">Monitoring Tindak Lanjut Rekomendasi KNKT</h1>
                            <p className="text-muted-foreground">
                                Track and manage follow-ups on NTSC safety recommendations.
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-2'>
                        <TabsList>
                            <TabsTrigger value="form">Input Form</TabsTrigger>
                            <TabsTrigger value="records">Records</TabsTrigger>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                <TabsContent value="form">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Recommendation Follow-Up</CardTitle>
                            <CardDescription>Fill out the form to add a new record.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ComingSoon />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="records">
                    <Card>
                        <CardHeader>
                            <CardTitle>Records</CardTitle>
                            <CardDescription>List of all recommendation follow-ups.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ComingSoon />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics">
                     <Card>
                        <CardHeader>
                            <CardTitle>Analytics</CardTitle>
                            <CardDescription>Visualizations of the follow-up data.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ComingSoon />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    );
}

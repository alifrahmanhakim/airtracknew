
'use client';

import * as React from 'react';
import type { TindakLanjutDgcaRecord } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Info } from 'lucide-react';
import { AnimatedCounter } from '../ui/animated-counter';

type AnalyticsProps = {
  allRecords: TindakLanjutDgcaRecord[];
};

export function TindakLanjutDgcaAnalytics({ allRecords }: AnalyticsProps) {

    if (allRecords.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
                <Info className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">No data to analyze.</p>
                <p className="text-sm">Submit records to see analytics.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Total Records</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold"><AnimatedCounter endValue={allRecords.length} /></p>
                </CardContent>
            </Card>
            <div className='text-center text-muted-foreground pt-10'>
                <p>More analytics will be available here soon.</p>
            </div>
        </div>
    )
}

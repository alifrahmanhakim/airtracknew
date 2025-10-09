
'use client';

import * as React from 'react';
import type { LawEnforcementRecord } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Info } from 'lucide-react';

type AnalyticsProps = {
  allRecords: LawEnforcementRecord[];
};

export function LawEnforcementAnalytics({ allRecords }: AnalyticsProps) {
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
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>
                        Visualizations of the law enforcement data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
                        <Info className="mx-auto h-8 w-8 mb-2" />
                        <p className="font-semibold">Analytics Coming Soon</p>
                        <p className="text-sm">More analytics will be available here soon.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

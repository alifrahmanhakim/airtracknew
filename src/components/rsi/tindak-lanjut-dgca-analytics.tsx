
'use client';

import * as React from 'react';
import type { TindakLanjutDgcaRecord } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Info, Building, Calendar, FileText } from 'lucide-react';
import { AnimatedCounter } from '../ui/animated-counter';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { getYear, parseISO } from 'date-fns';

type AnalyticsProps = {
  allRecords: TindakLanjutDgcaRecord[];
};

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];


export function TindakLanjutDgcaAnalytics({ allRecords }: AnalyticsProps) {

    const analyticsData = React.useMemo(() => {
        const totalRecords = allRecords.length;
        const totalOperators = new Set(allRecords.map(r => r.operator)).size;
        const currentYear = new Date().getFullYear();
        const recordsThisYear = allRecords.filter(r => getYear(parseISO(r.tanggalKejadian)) === currentYear).length;
        
        const recordsByYear = allRecords.reduce((acc, record) => {
            const year = getYear(parseISO(record.tanggalKejadian));
            acc[year] = (acc[year] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const yearData = Object.entries(recordsByYear).map(([name, value]) => ({ name, value })).sort((a,b) => parseInt(a.name) - parseInt(b.name));
        
        const recordsByOperator = allRecords.reduce((acc, record) => {
            acc[record.operator] = (acc[record.operator] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const operatorData = Object.entries(recordsByOperator).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10);

        return { totalRecords, totalOperators, recordsThisYear, yearData, operatorData };
    }, [allRecords]);

    const chartConfig = (data: {name: string, value: number}[]) => ({
        value: { label: 'Count' },
        ...data.reduce((acc, item, index) => {
            acc[item.name] = { label: item.name, color: CHART_COLORS[index % CHART_COLORS.length]};
            return acc;
        }, {} as any)
    });

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><FileText /> Total Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold"><AnimatedCounter endValue={analyticsData.totalRecords} /></p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><Building /> Unique Operators</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold"><AnimatedCounter endValue={analyticsData.totalOperators} /></p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><Calendar /> Records This Year</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold"><AnimatedCounter endValue={analyticsData.recordsThisYear} /></p>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Records by Year</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig(analyticsData.yearData)} className="h-[300px] w-full">
                        <ResponsiveContainer>
                            <BarChart data={analyticsData.yearData}>
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Top 10 Operators by Records</CardTitle>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={chartConfig(analyticsData.operatorData)} className="h-[400px] w-full">
                        <ResponsiveContainer>
                            <BarChart data={analyticsData.operatorData} layout="vertical" margin={{ left: 50, right: 30 }}>
                                <YAxis dataKey="name" type="category" width={150} interval={0} tick={{ fontSize: 12 }} />
                                <XAxis type="number" allowDecimals={false} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {analyticsData.operatorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}

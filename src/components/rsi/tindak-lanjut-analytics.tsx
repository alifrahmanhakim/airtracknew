
'use client';

import * as React from 'react';
import type { TindakLanjutRecord } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Info } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '../ui/chart';

type AnalyticsProps = {
  allRecords: TindakLanjutRecord[];
};

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

export function TindakLanjutAnalytics({ allRecords }: AnalyticsProps) {

    const analyticsData = React.useMemo(() => {
        const recordsByYear = allRecords.reduce((acc, record) => {
            const year = record.tahun;
            acc[year] = (acc[year] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const yearData = Object.entries(recordsByYear).map(([name, value]) => ({ name, value })).sort((a,b) => parseInt(a.name) - parseInt(b.name));
        
        const recordsByPenerima = allRecords.reduce((acc, record) => {
            const penerimaList = Array.isArray(record.penerimaRekomendasi)
                ? record.penerimaRekomendasi
                : (typeof record.penerimaRekomendasi === 'string' && record.penerimaRekomendasi ? [record.penerimaRekomendasi] : []);

            penerimaList.forEach(penerima => {
                acc[penerima] = (acc[penerima] || 0) + 1;
            });
            return acc;
        }, {} as Record<string, number>);

        const penerimaData = Object.entries(recordsByPenerima).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10);
        
        const recordsByStatus = allRecords.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const statusData = Object.entries(recordsByStatus).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);


        return { yearData, penerimaData, statusData, totalRecords: allRecords.length };
    }, [allRecords]);
    
    if (allRecords.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
                <Info className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">No data to analyze.</p>
                <p className="text-sm">Submit records to see analytics.</p>
            </div>
        );
    }
    
    const chartConfig = (data: {name: string, value: number}[]) => ({
        value: { label: 'Count' },
        ...data.reduce((acc, item, index) => {
            acc[item.name] = { label: item.name, color: CHART_COLORS[index % CHART_COLORS.length]};
            return acc;
        }, {} as any)
    });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Total Records</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{analyticsData.totalRecords}</p>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Records by Year</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig(analyticsData.yearData)} className="h-[300px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={analyticsData.yearData}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Report Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <ChartContainer config={chartConfig(analyticsData.statusData)} className="mx-auto aspect-square h-[300px]">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie data={analyticsData.statusData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                    {analyticsData.statusData.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={chartConfig(analyticsData.statusData)[entry.name].color} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center" />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Top 10 Penerima Rekomendasi</CardTitle>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={chartConfig(analyticsData.penerimaData)} className="h-[400px] w-full">
                        <ResponsiveContainer>
                            <BarChart data={analyticsData.penerimaData} layout="vertical" margin={{ left: 50, right: 30 }}>
                                <YAxis dataKey="name" type="category" width={150} interval={0} tick={{ fontSize: 12 }} />
                                <XAxis type="number" allowDecimals={false} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {analyticsData.penerimaData.map((entry, index) => (
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

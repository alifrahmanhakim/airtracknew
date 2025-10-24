
'use client';

import * as React from 'react';
import type { TindakLanjutRecord } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Info } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '../ui/chart';
import { AnimatedCounter } from '../ui/animated-counter';

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

const STATUS_COLORS: Record<string, string> = {
    'Final': 'hsl(142.1, 76.2%, 42.2%)',       // Green
    'Draft': 'hsl(47.9, 95.8%, 53.1%)',        // Yellow
    'Preliminary': 'hsl(221.2, 83.2%, 53.3%)', // Blue
    'Draft Final': 'hsl(24.6, 95%, 53.1%)',   // Orange
    'Interim Statement': 'hsl(262.1, 83.3%, 57.8%)', // Purple
    'Usulan': 'hsl(0, 84.2%, 60.2%)', // Red
};


export function TindakLanjutAnalytics({ allRecords }: AnalyticsProps) {

    const analyticsData = React.useMemo(() => {
        const recordsByYear = allRecords.reduce((acc, record) => {
            const year = record.tahun;
            const status = record.status || 'Usulan';
            if (!acc[year]) {
                acc[year] = { name: String(year), Draft: 0, Final: 0, Usulan: 0, Preliminary: 0, 'Interim Statement': 0, 'Draft Final': 0 };
            }
            if (status in acc[year]) {
                (acc[year] as any)[status]++;
            }
            return acc;
        }, {} as Record<number, { name: string; Draft: number; Final: number; Usulan: number, Preliminary: number, 'Interim Statement': number, 'Draft Final': number }>);
        
        const yearData = Object.values(recordsByYear).sort((a, b) => parseInt(a.name) - parseInt(b.name));
        
        const recordsByPenerima = allRecords.reduce((acc, record) => {
            const penerimaList = Array.isArray(record.penerimaRekomendasi)
                ? record.penerimaRekomendasi
                : (typeof record.penerimaRekomendasi === 'string' && record.penerimaRekomendasi ? [record.penerimaRekomendasi] : []);

            penerimaList.forEach(penerima => {
                if (penerima && penerima.trim() !== '') {
                    acc[penerima] = (acc[penerima] || 0) + 1;
                }
            });
            return acc;
        }, {} as Record<string, number>);

        const penerimaData = Object.entries(recordsByPenerima).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10);
        
        const recordsByStatus = allRecords.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const statusData = Object.entries(recordsByStatus).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || CHART_COLORS[4] })).sort((a,b) => b.value - a.value);


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
    
    const chartConfig = (data: {name: string, value: number, fill?: string}[]) => ({
        value: { label: 'Count' },
        ...data.reduce((acc, item, index) => {
            acc[item.name] = { label: item.name, color: item.fill || CHART_COLORS[index % CHART_COLORS.length]};
            return acc;
        }, {} as any)
    });

    const yearChartConfig = chartConfig(analyticsData.statusData);


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Total Records</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold"><AnimatedCounter endValue={analyticsData.totalRecords} /></p>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Records by Year</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={yearChartConfig} className="h-[300px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={analyticsData.yearData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false}/>
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Legend />
                                    {Object.keys(STATUS_COLORS).map(status => (
                                        <Bar key={status} dataKey={status} stackId="a" fill={STATUS_COLORS[status]} />
                                    ))}
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
                                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
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
                     <ChartContainer config={chartConfig(analyticsData.penerimaData)} className="h-auto w-full" style={{ height: `${Math.max(200, analyticsData.penerimaData.length * 40)}px` }}>
                        <ResponsiveContainer>
                            <BarChart data={analyticsData.penerimaData} layout="vertical" margin={{ left: 100, right: 30 }}>
                                <YAxis dataKey="name" type="category" width={200} interval={0} tick={{ fontSize: 12, width: 200, }} />
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

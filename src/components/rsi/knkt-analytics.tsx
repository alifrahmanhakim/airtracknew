
'use client';

import * as React from 'react';
import type { KnktReport } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { RotateCcw, Plane, AlertTriangle, Users, Info } from 'lucide-react';
import { getYear, parseISO } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '../ui/chart';
import { AnimatedCounter } from '../ui/animated-counter';

type AnalyticsProps = {
  allRecords: KnktReport[];
};

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

export function KnktAnalytics({ allRecords }: AnalyticsProps) {
    const [operatorFilter, setOperatorFilter] = React.useState('all');
    const [yearFilter, setYearFilter] = React.useState('all');

    const operatorOptions = React.useMemo(() => ['all', ...[...new Set(allRecords.map(r => r.operator))].sort()], [allRecords]);
    const yearOptions = React.useMemo(() => ['all', ...[...new Set(allRecords.map(r => getYear(parseISO(r.tanggal_diterbitkan))))].sort((a, b) => b - a)], [allRecords]);
    
    const filteredRecords = React.useMemo(() => {
        return allRecords.filter(r => {
            const operatorMatch = operatorFilter === 'all' || r.operator === operatorFilter;
            const yearMatch = yearFilter === 'all' || getYear(parseISO(r.tanggal_diterbitkan)) === parseInt(yearFilter);
            return operatorMatch && yearMatch;
        });
    }, [allRecords, operatorFilter, yearFilter]);
    
    const analyticsData = React.useMemo(() => {
        const totalReports = filteredRecords.length;
        
        const countBy = (key: keyof KnktReport) => filteredRecords.reduce((acc, record) => {
            const value = record[key] as string;
            if (value) acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const reportsByYear = Object.entries(countBy('tanggal_diterbitkan')).reduce((acc, [date, count]) => {
            const year = getYear(parseISO(date)).toString();
            acc[year] = (acc[year] || 0) + count;
            return acc;
        }, {} as Record<string, number>);
        const yearData = Object.entries(reportsByYear).map(([name, value]) => ({ name, value })).sort((a,b) => parseInt(a.name) - parseInt(b.name));
        
        const reportsByStatus = countBy('status');
        const statusData = Object.entries(reportsByStatus).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

        const reportsByOperator = countBy('operator');
        const operatorData = Object.entries(reportsByOperator).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10);

        return {
            totalReports,
            yearData,
            statusData,
            operatorData,
        };
    }, [filteredRecords]);

    const resetFilters = () => {
        setOperatorFilter('all');
        setYearFilter('all');
    };
    
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
            <Card>
                <CardHeader>
                    <CardTitle>Analytics Dashboard</CardTitle>
                    <CardDescription>
                        Filters apply to all charts and statistics below.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Select value={operatorFilter} onValueChange={setOperatorFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by Operator..." /></SelectTrigger>
                        <SelectContent>{operatorOptions.map(op => <SelectItem key={op} value={op}>{op === 'all' ? 'All Operators' : op}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={String(yearFilter)} onValueChange={setYearFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by year..." /></SelectTrigger>
                        <SelectContent>{yearOptions.map(year => <SelectItem key={year} value={String(year)}>{year === 'all' ? 'All Years' : year}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="ghost" onClick={resetFilters}><RotateCcw className="mr-2 h-4 w-4" /> Reset Filters</Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1">
                 <Card>
                    <CardHeader><CardTitle>Total Reports</CardTitle></CardHeader>
                    <CardContent className="flex items-end gap-4">
                        <Plane className="h-10 w-10 text-muted-foreground" />
                        <p className="text-5xl font-bold"><AnimatedCounter endValue={analyticsData.totalReports} /></p>
                    </CardContent>
                 </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader><CardTitle>Reports by Year</CardTitle></CardHeader>
                    <CardContent><ChartContainer config={chartConfig(analyticsData.yearData)} className="h-[300px] w-full"><ResponsiveContainer><BarChart data={analyticsData.yearData}><CartesianGrid vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} /><YAxis allowDecimals={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="value" fill="hsl(var(--chart-1))" radius={4} /></BarChart></ResponsiveContainer></ChartContainer></CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Report Status</CardTitle></CardHeader>
                    <CardContent><ChartContainer config={chartConfig(analyticsData.statusData)} className="mx-auto aspect-square h-[300px]"><PieChart><ChartTooltip content={<ChartTooltipContent hideLabel />} /><Pie data={analyticsData.statusData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>{analyticsData.statusData.map(entry => <Cell key={`cell-${entry.name}`} fill={chartConfig(analyticsData.statusData)[entry.name]?.color} />)}</Pie><ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center" /></PieChart></ChartContainer></CardContent>
                </Card>
            </div>

             <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader><CardTitle>Top 10 Operators by Reports</CardTitle></CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig(analyticsData.operatorData)} className="h-[400px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={analyticsData.operatorData} layout="vertical" margin={{ left: -10, right: 30 }}>
                                    <CartesianGrid horizontal={false} />
                                    <YAxis dataKey="name" type="category" interval={0} tick={{fontSize: 12}} width={200} />
                                    <XAxis type="number" allowDecimals={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={4}>{analyticsData.operatorData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

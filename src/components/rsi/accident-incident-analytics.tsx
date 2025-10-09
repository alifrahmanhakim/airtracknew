
'use client';

import * as React from 'react';
import type { AccidentIncidentRecord } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { RotateCcw, Plane, AlertTriangle, Users, Info } from 'lucide-react';
import { getYear, parseISO } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '../ui/chart';
import { AnimatedCounter } from '../ui/animated-counter';
import { Tooltip as UiTooltip, TooltipContent as UiTooltipContent, TooltipTrigger as UiTooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

type AnalyticsProps = {
  allRecords: AccidentIncidentRecord[];
};

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

const parseCasualties = (casualtyString: string): number => {
    if (!casualtyString || casualtyString.toLowerCase() === 'tidak ada') {
      return 0;
    }
    const match = casualtyString.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
};

const CustomYAxisTick = ({ y, payload }: any) => {
    const value = payload.value;
    const MAX_LENGTH = 25;
    const truncatedValue = value.length > MAX_LENGTH ? `${value.substring(0, MAX_LENGTH)}...` : value;

    return (
        <TooltipProvider>
            <UiTooltip>
                <UiTooltipTrigger asChild>
                    <g transform={`translate(0,${y})`}>
                        <text x={0} y={0} dy={4} textAnchor="end" fill="#666" fontSize={12}>
                            {truncatedValue}
                        </text>
                    </g>
                </UiTooltipTrigger>
                <UiTooltipContent side="left">
                    <p>{value}</p>
                </UiTooltipContent>
            </UiTooltip>
        </TooltipProvider>
    );
};


export function AccidentIncidentAnalytics({ allRecords }: AnalyticsProps) {
    const [operatorFilter, setOperatorFilter] = React.useState('all');
    const [categoryFilter, setCategoryFilter] = React.useState('all');
    const [taxonomyFilter, setTaxonomyFilter] = React.useState('all');
    const [yearFilter, setYearFilter] = React.useState('all');

    const operatorOptions = React.useMemo(() => ['all', ...[...new Set(allRecords.map(r => r.operator))].sort()], [allRecords]);
    const categoryOptions = React.useMemo(() => ['all', ...[...new Set(allRecords.map(r => r.kategori))].sort()], [allRecords]);
    const taxonomyOptions = React.useMemo(() => ['all', ...[...new Set(allRecords.map(r => r.taxonomy))].sort()], [allRecords]);
    const yearOptions = React.useMemo(() => ['all', ...[...new Set(allRecords.map(r => getYear(parseISO(r.tanggal))))].sort((a, b) => b - a)], [allRecords]);
    
    const filteredRecords = React.useMemo(() => {
        return allRecords.filter(r => {
            const operatorMatch = operatorFilter === 'all' || r.operator === operatorFilter;
            const categoryMatch = categoryFilter === 'all' || r.kategori === categoryFilter;
            const taxonomyMatch = taxonomyFilter === 'all' || r.taxonomy === taxonomyFilter;
            const yearMatch = yearFilter === 'all' || getYear(parseISO(r.tanggal)) === parseInt(yearFilter);
            return operatorMatch && categoryMatch && taxonomyMatch && yearMatch;
        });
    }, [allRecords, operatorFilter, categoryFilter, taxonomyFilter, yearFilter]);
    
    const analyticsData = React.useMemo(() => {
        const totalIncidents = filteredRecords.length;
        const totalAccidents = filteredRecords.filter(r => r.kategori === 'Accident (A)').length;
        const totalSeriousIncidents = totalIncidents - totalAccidents;
        const totalCasualties = filteredRecords.reduce((sum, r) => sum + parseCasualties(r.korbanJiwa), 0);

        const categoryData = [
            { name: 'Accident (A)', value: totalAccidents },
            { name: 'Serious Incident (SI)', value: totalSeriousIncidents },
        ].filter(d => d.value > 0);
        
        const countBy = (key: keyof AccidentIncidentRecord) => filteredRecords.reduce((acc, record) => {
            const value = record[key] as string;
            if (value) acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const incidentsByYear = Object.entries(countBy('tanggal')).reduce((acc, [date, count]) => {
            const year = getYear(parseISO(date)).toString();
            acc[year] = (acc[year] || 0) + count;
            return acc;
        }, {} as Record<string, number>);
        const yearData = Object.entries(incidentsByYear).map(([name, value]) => ({ name, value })).sort((a,b) => parseInt(a.name) - parseInt(b.name));
        
        const incidentsByTaxonomy = countBy('taxonomy');
        const taxonomyData = Object.entries(incidentsByTaxonomy).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

        const incidentsByOperator = countBy('operator');
        const operatorData = Object.entries(incidentsByOperator).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10);

        return {
            totalIncidents,
            totalAccidents,
            totalSeriousIncidents,
            totalCasualties,
            categoryData,
            yearData,
            taxonomyData,
            operatorData,
        };
    }, [filteredRecords]);

    const resetFilters = () => {
        setOperatorFilter('all');
        setCategoryFilter('all');
        setTaxonomyFilter('all');
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
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <Select value={operatorFilter} onValueChange={setOperatorFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by operator..." /></SelectTrigger>
                        <SelectContent>{operatorOptions.map(op => <SelectItem key={op} value={op}>{op === 'all' ? 'All Operators' : op}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by category..." /></SelectTrigger>
                        <SelectContent>{categoryOptions.map(cat => <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={taxonomyFilter} onValueChange={setTaxonomyFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by taxonomy..." /></SelectTrigger>
                        <SelectContent>{taxonomyOptions.map(tax => <SelectItem key={tax} value={tax}>{tax === 'all' ? 'All Taxonomies' : tax}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={String(yearFilter)} onValueChange={setYearFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by year..." /></SelectTrigger>
                        <SelectContent>{yearOptions.map(year => <SelectItem key={year} value={String(year)}>{year === 'all' ? 'All Years' : year}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="ghost" onClick={resetFilters}><RotateCcw className="mr-2 h-4 w-4" /> Reset Filters</Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <Card><CardHeader><CardTitle>Total Incidents</CardTitle></CardHeader><CardContent className="flex items-end gap-4"><Plane className="h-10 w-10 text-muted-foreground" /><p className="text-5xl font-bold"><AnimatedCounter endValue={analyticsData.totalIncidents} /></p></CardContent></Card>
                 <Card><CardHeader><CardTitle>Accidents</CardTitle></CardHeader><CardContent className="flex items-end gap-4"><AlertTriangle className="h-10 w-10 text-destructive" /><p className="text-5xl font-bold text-destructive"><AnimatedCounter endValue={analyticsData.totalAccidents} /></p></CardContent></Card>
                 <Card><CardHeader><CardTitle>Serious Incidents</CardTitle></CardHeader><CardContent className="flex items-end gap-4"><AlertTriangle className="h-10 w-10 text-yellow-500" /><p className="text-5xl font-bold text-yellow-500"><AnimatedCounter endValue={analyticsData.totalSeriousIncidents} /></p></CardContent></Card>
                 <Card><CardHeader><CardTitle>Total Casualties</CardTitle></CardHeader><CardContent className="flex items-end gap-4"><Users className="h-10 w-10 text-muted-foreground" /><p className="text-5xl font-bold"><AnimatedCounter endValue={analyticsData.totalCasualties} /></p></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader><CardTitle>Incidents by Year</CardTitle></CardHeader>
                    <CardContent><ChartContainer config={chartConfig(analyticsData.yearData)} className="h-[300px] w-full"><ResponsiveContainer><BarChart data={analyticsData.yearData}><CartesianGrid vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} /><YAxis allowDecimals={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="value" fill="hsl(var(--chart-1))" radius={4} /></BarChart></ResponsiveContainer></ChartContainer></CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Incident Category</CardTitle></CardHeader>
                    <CardContent><ChartContainer config={chartConfig(analyticsData.categoryData)} className="mx-auto aspect-square h-[300px]"><PieChart><ChartTooltip content={<ChartTooltipContent hideLabel />} /><Pie data={analyticsData.categoryData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>{analyticsData.categoryData.map(entry => <Cell key={`cell-${entry.name}`} fill={chartConfig(analyticsData.categoryData)[entry.name]?.color} />)}</Pie><ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center" /></PieChart></ChartContainer></CardContent>
                </Card>
            </div>

             <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader><CardTitle>Top 10 Operators by Incidents</CardTitle></CardHeader>
                    <CardContent><ChartContainer config={chartConfig(analyticsData.operatorData)} className="h-[400px] w-full"><ResponsiveContainer><BarChart data={analyticsData.operatorData} layout="vertical" margin={{ left: 150 }}><CartesianGrid horizontal={false} /><YAxis dataKey="name" type="category" interval={0} tick={<CustomYAxisTick />} width={160} /><XAxis type="number" allowDecimals={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="value" fill="hsl(var(--chart-1))" radius={4}>{analyticsData.operatorData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></ChartContainer></CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Incidents by Taxonomy</CardTitle></CardHeader>
                    <CardContent><ChartContainer config={chartConfig(analyticsData.taxonomyData)} className="h-[400px] w-full"><ResponsiveContainer><BarChart data={analyticsData.taxonomyData} layout="vertical" margin={{ left: 200 }}><CartesianGrid horizontal={false} /><YAxis dataKey="name" type="category" interval={0} tick={{fontSize: 12}} /><XAxis type="number" allowDecimals={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="value" fill="hsl(var(--chart-1))" radius={4}>{analyticsData.taxonomyData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></ChartContainer></CardContent>
                </Card>
            </div>

        </div>
    );
}

    
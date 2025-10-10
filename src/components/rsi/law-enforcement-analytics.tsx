
'use client';

import * as React from 'react';
import type { LawEnforcementRecord } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Info, Building, User, Gavel } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '../ui/chart';
import { getYear, parseISO } from 'date-fns';
import { AnimatedCounter } from '../ui/animated-counter';
import { cn } from '@/lib/utils';

type AnalyticsProps = {
  allRecords: LawEnforcementRecord[];
};

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

export function LawEnforcementAnalytics({ allRecords }: AnalyticsProps) {

    const analyticsData = React.useMemo(() => {
        const totalRecords = allRecords.length;
        
        const sanctionsByType = allRecords.reduce((acc, record) => {
            acc[record.impositionType] = (acc[record.impositionType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const totalImpositions = Object.values(sanctionsByType).reduce((a, b) => a + b, 0);
        const impositionTypeData = Object.entries(sanctionsByType).map(([name, value]) => ({
            name: `${name.charAt(0).toUpperCase() + name.slice(1)} (${value}) - ${totalImpositions > 0 ? ((value / totalImpositions) * 100).toFixed(1) : 0}%`,
            value,
            originalName: name,
        }));


        const sanctionsByYear = allRecords.reduce((acc, record) => {
            if (record.references && record.references.length > 0 && record.references[0].dateLetter) {
                const year = getYear(parseISO(record.references[0].dateLetter));
                acc[year] = (acc[year] || 0) + 1;
            }
            return acc;
        }, {} as Record<number, number>);

        const yearData = Object.entries(sanctionsByYear).map(([name, value]) => ({ name, value })).sort((a,b) => parseInt(a.name) - parseInt(b.name));

        const sanctionsBySanctionType = allRecords.reduce((acc, record) => {
            if (record.references && record.references.length > 0) {
                record.references.forEach(ref => {
                   if(ref.sanctionType) {
                     acc[ref.sanctionType] = (acc[ref.sanctionType] || 0) + 1;
                   }
                })
            }
            return acc;
        }, {} as Record<string, number>);

        const sanctionTypeData = Object.entries(sanctionsBySanctionType).map(([name, value]) => ({name, value})).sort((a,b) => b.value - a.value).slice(0, 10);

        return {
            totalRecords,
            impositionTypeData,
            yearData,
            sanctionTypeData,
            totalAoc: sanctionsByType['aoc'] || 0,
            totalPersonnel: sanctionsByType['personnel'] || 0,
            totalOrganization: sanctionsByType['organization'] || 0,
        };

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
    
    const chartConfig = (data: {name: string, value: number, originalName?: string}[]) => ({
        value: { label: 'Count' },
        ...data.reduce((acc, item, index) => {
            const key = item.originalName || item.name;
            acc[key] = { label: item.name, color: CHART_COLORS[index % CHART_COLORS.length]};
            return acc;
        }, {} as any)
    });


    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="relative group overflow-hidden rounded-lg">
                     <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-yellow-500 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-500 animate-gradient-move"></div>
                     <div className="relative bg-card rounded-lg h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><Gavel /> Total Sanctions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold"><AnimatedCounter endValue={analyticsData.totalRecords} /></p>
                        </CardContent>
                    </div>
                </Card>
                <Card className="relative group overflow-hidden rounded-lg">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-yellow-500 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-500 animate-gradient-move"></div>
                    <div className="relative bg-card rounded-lg h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><Building /> Sanctioned AOCs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold"><AnimatedCounter endValue={analyticsData.totalAoc} /></p>
                        </CardContent>
                    </div>
                </Card>
                <Card className="relative group overflow-hidden rounded-lg">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-yellow-500 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-500 animate-gradient-move"></div>
                    <div className="relative bg-card rounded-lg h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><User /> Sanctioned Personnel</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold"><AnimatedCounter endValue={analyticsData.totalPersonnel} /></p>
                        </CardContent>
                    </div>
                </Card>
                <Card className="relative group overflow-hidden rounded-lg">
                     <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-yellow-500 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-500 animate-gradient-move"></div>
                     <div className="relative bg-card rounded-lg h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><Building /> Sanctioned Orgs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold"><AnimatedCounter endValue={analyticsData.totalOrganization} /></p>
                        </CardContent>
                    </div>
                </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Sanctions by Year</CardTitle>
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
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Imposition by Type</CardTitle>
                        <CardDescription>Breakdown of sanctions by the type of entity.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center">
                        <ChartContainer config={chartConfig(analyticsData.impositionTypeData)} className="mx-auto aspect-square h-[300px]">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie data={analyticsData.impositionTypeData} dataKey="value" nameKey="originalName" innerRadius={60} strokeWidth={5}>
                                    {analyticsData.impositionTypeData.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={chartConfig(analyticsData.impositionTypeData)[entry.originalName].color} />
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
                    <CardTitle>Top 10 Sanction Types</CardTitle>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={chartConfig(analyticsData.sanctionTypeData)} className="h-auto w-full" style={{ height: `${Math.max(200, analyticsData.sanctionTypeData.length * 40)}px` }}>
                        <ResponsiveContainer>
                            <BarChart data={analyticsData.sanctionTypeData} layout="vertical" margin={{ left: 100, right: 30 }}>
                                <YAxis dataKey="name" type="category" width={200} interval={0} tick={{ fontSize: 12 }} />
                                <XAxis type="number" allowDecimals={false} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {analyticsData.sanctionTypeData.map((entry, index) => (
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

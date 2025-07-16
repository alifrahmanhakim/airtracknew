
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { GitCompareArrows, Info, Target } from 'lucide-react';
import type { GapAnalysisRecord, EvaluationItem } from '@/lib/types';

type RulemakingAnalyticsProps = {
    records: GapAnalysisRecord[];
};

const CHART_COLORS = {
  blue: 'hsl(var(--chart-1))',
  green: 'hsl(var(--chart-2))',
  yellow: 'hsl(var(--chart-3))',
  red: 'hsl(var(--chart-4))',
  purple: 'hsl(var(--chart-5))',
  gray: 'hsl(var(--muted))',
};

const COMPLIANCE_STATUS_ORDER: { status: EvaluationItem['complianceStatus']; color: string }[] = [
    { status: 'No Differences', color: CHART_COLORS.blue },
    { status: 'More Exacting or Exceeds', color: CHART_COLORS.green },
    { status: 'Different in character or other means of compliance', color: CHART_COLORS.yellow },
    { status: 'Less protective or partially implemented or not implemented', color: CHART_COLORS.red },
    { status: 'Not Applicable', color: CHART_COLORS.gray },
];

const FOLLOW_UP_STATUS_ORDER: { status: GapAnalysisRecord['statusItem']; color: string }[] = [
    { status: 'CLOSED', color: CHART_COLORS.blue },
    { status: 'OPEN', color: CHART_COLORS.red },
];

const CustomYAxisTick = ({ y, payload, totalValue }: { y: number; payload: { value: string }; totalValue: number }) => {
    const { name, value, percentage } = payload.value as any;
    return (
        <g transform={`translate(0,${y})`}>
            <text x={0} y={0} dy={4} textAnchor="start" fill="hsl(var(--foreground))" className="text-xs">
                {name}
            </text>
            <text x={240} y={0} dy={4} textAnchor="end" fill="hsl(var(--muted-foreground))" className="text-xs font-mono">
                {`${value} (${percentage.toFixed(1)}%)`}
            </text>
        </g>
    );
};


export function RulemakingAnalytics({ records }: RulemakingAnalyticsProps) {
    const analyticsData = React.useMemo(() => {
        if (!records || records.length === 0) {
            return null;
        }

        const allEvaluations = records.flatMap(r => r.evaluations || []);
        const totalEvaluations = allEvaluations.length;

        const complianceStatusCounts = allEvaluations.reduce((acc, evaluation) => {
            acc[evaluation.complianceStatus] = (acc[evaluation.complianceStatus] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const complianceStatusData = COMPLIANCE_STATUS_ORDER.map(({ status, color }) => ({
            name: status,
            value: complianceStatusCounts[status] || 0,
            percentage: totalEvaluations > 0 ? (complianceStatusCounts[status] || 0) / totalEvaluations * 100 : 0,
            fill: color
        })).filter(d => d.value > 0);

        const statusItemCounts = records.reduce((acc, record) => {
            acc[record.statusItem] = (acc[record.statusItem] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const statusItemData = FOLLOW_UP_STATUS_ORDER.map(({ status, color }) => ({
            name: status,
            value: statusItemCounts[status] || 0,
            fill: color,
        }));
        
        const totalStatusItems = records.length;
        const closedCount = statusItemCounts['CLOSED'] || 0;
        const closedPercentage = totalStatusItems > 0 ? (closedCount / totalStatusItems) * 100 : 0;
        
        const noDifferencesCount = complianceStatusCounts['No Differences'] || 0;
        const noDifferencesPercentage = totalEvaluations > 0 ? (noDifferencesCount / totalEvaluations) * 100 : 0;

        return { 
            totalRecords: records.length,
            complianceStatusData, 
            statusItemData,
            closedPercentage,
            noDifferencesPercentage,
            totalEvaluations,
        };
    }, [records]);

    if (!analyticsData) {
        return (
            <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
                <Info className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">No GAP Analysis Data Available</p>
                <p className="text-sm">Link a GAP analysis record to this CASR to see analytics.</p>
            </div>
        );
    }
    
    const complianceChartConfig = analyticsData.complianceStatusData.reduce((acc, item) => {
        acc[item.name] = { label: item.name, color: item.fill };
        return acc;
    }, {} as any);

    const followUpChartConfig = analyticsData.statusItemData.reduce((acc, item) => {
        acc[item.name] = { label: item.name, color: item.fill };
        return acc;
    }, {} as any);


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <Card>
                <CardHeader>
                    <CardTitle>Total GAP Analysis</CardTitle>
                    <CardDescription>Total records linked to this CASR</CardDescription>
                </CardHeader>
                 <CardContent>
                    <div className="flex items-baseline gap-4">
                        <GitCompareArrows className="h-10 w-10 text-muted-foreground" />
                        <p className="text-5xl font-bold">{analyticsData.totalRecords}</p>
                    </div>
                 </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Follow Up Status</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center">
                    <ChartContainer config={followUpChartConfig} className="mx-auto aspect-square h-24">
                        <PieChart>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Pie data={analyticsData.statusItemData} dataKey="value" nameKey="name" innerRadius="60%" strokeWidth={5}>
                                {analyticsData.statusItemData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                     <div className="text-center">
                        <p className="text-4xl font-bold">{analyticsData.closedPercentage.toFixed(0)}%</p>
                        <p className="text-sm text-muted-foreground">Closed</p>
                    </div>
                </CardContent>
            </Card>
            <Card className='md:col-span-2'>
                 <CardHeader>
                    <CardTitle>Compliance Rate</CardTitle>
                    <CardDescription>Percentage of compliance with "No Differences".</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <div className="flex items-baseline gap-4">
                         <Target className="h-10 w-10 text-muted-foreground" />
                         <p className="text-5xl font-bold">{analyticsData.noDifferencesPercentage.toFixed(0)}%</p>
                    </div>
                 </CardContent>
            </Card>
            <Card className="md:col-span-2 lg:col-span-4">
                <CardHeader>
                    <CardTitle>DGCA Compliance/Differences Status</CardTitle>
                    <CardDescription>Rincian status kepatuhan dari semua item evaluasi.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ChartContainer config={complianceChartConfig} className="h-[250px] w-full">
                        <ResponsiveContainer>
                            <BarChart data={analyticsData.complianceStatusData} layout="vertical" margin={{ left: 5, right: 30, top: 5, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={250}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={(props) => <CustomYAxisTick {...props} totalValue={analyticsData.totalEvaluations} />}
                                    interval={0}
                                />
                                <ChartTooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <Bar dataKey="value" layout="vertical" radius={[0, 4, 4, 0]}>
                                    {analyticsData.complianceStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}

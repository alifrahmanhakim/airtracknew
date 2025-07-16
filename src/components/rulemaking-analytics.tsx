
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Info } from 'lucide-react';
import type { GapAnalysisRecord, EvaluationItem } from '@/lib/types';
import { cn } from '@/lib/utils';


type RulemakingAnalyticsProps = {
    records: GapAnalysisRecord[];
};

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--muted))',
];

const COMPLIANCE_STATUS_ORDER: EvaluationItem['complianceStatus'][] = [
    'No Differences',
    'More Exacting or Exceeds',
    'Different in character or other means of compliance',
    'Less protective or partially implemented or not implemented',
    'Not Applicable',
];

export function RulemakingAnalytics({ records }: RulemakingAnalyticsProps) {
    const analyticsData = React.useMemo(() => {
        if (!records || records.length === 0) {
            return null;
        }

        const allEvaluations = records.flatMap(r => r.evaluations || []);

        const complianceStatusCounts = allEvaluations.reduce((acc, evaluation) => {
            acc[evaluation.complianceStatus] = (acc[evaluation.complianceStatus] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const complianceStatusData = COMPLIANCE_STATUS_ORDER.map(status => ({
            name: status,
            value: complianceStatusCounts[status] || 0,
        }));

        const statusItemCounts = records.reduce((acc, record) => {
            acc[record.statusItem] = (acc[record.statusItem] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const statusItemData = [
            { name: 'OPEN', value: statusItemCounts['OPEN'] || 0 },
            { name: 'CLOSED', value: statusItemCounts['CLOSED'] || 0 },
        ];

        return { complianceStatusData, statusItemData };
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
    
    const complianceChartConfig = {
        value: { label: 'Count' },
        ...analyticsData.complianceStatusData.reduce((acc, item, index) => {
            acc[item.name] = { label: item.name, color: CHART_COLORS[index % CHART_COLORS.length] };
            return acc;
        }, {} as any)
    };

    const followUpChartConfig = {
        value: { label: 'Count' },
        OPEN: { label: 'Open', color: 'hsl(var(--chart-3))' },
        CLOSED: { label: 'Closed', color: 'hsl(var(--chart-1))' },
    };


    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>DGCA Compliance/Differences Status</CardTitle>
                    <CardDescription>Breakdown of all compliance statuses from evaluations.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ChartContainer config={complianceChartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer>
                            <BarChart data={analyticsData.complianceStatusData} layout="vertical" margin={{ left: 150 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={150}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                                />
                                <ChartTooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <Bar dataKey="value" layout="vertical" radius={[0, 4, 4, 0]}>
                                    {analyticsData.complianceStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Follow Up Status</CardTitle>
                    <CardDescription>Distribution of OPEN vs CLOSED items from GAP analyses.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                    <ChartContainer config={followUpChartConfig} className="mx-auto aspect-square h-[250px]">
                        <PieChart>
                            <ChartTooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie data={analyticsData.statusItemData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                {analyticsData.statusItemData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={cn(followUpChartConfig[entry.name]?.color)} />
                                ))}
                            </Pie>
                            <ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center" />
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}

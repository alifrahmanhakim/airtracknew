
'use client';

import * as React from 'react';
import type { EvaluationItem, GapAnalysisRecord } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Info, GitCompareArrows, CheckCircle, Clock } from 'lucide-react';
import { AnimatedCounter } from './ui/animated-counter';

type GapAnalysisAnalyticsDashboardProps = {
  records: GapAnalysisRecord[];
};

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

const COMPLIANCE_STATUS_ORDER: { status: EvaluationItem['complianceStatus']; color: string }[] = [
    { status: 'No Differences', color: CHART_COLORS[0] },
    { status: 'More Exacting or Exceeds', color: CHART_COLORS[1] },
    { status: 'Different in character or other means of compliance', color: CHART_COLORS[2] },
    { status: 'Less protective or partially implemented or not implemented', color: CHART_COLORS[3] },
    { status: 'Not Applicable', color: CHART_COLORS[4] },
];

export function GapAnalysisAnalyticsDashboard({ records }: GapAnalysisAnalyticsDashboardProps) {
  const analyticsData = React.useMemo(() => {
    if (records.length === 0) {
      return null;
    }

    const totalRecords = records.length;
    const openRecords = records.filter(r => r.statusItem === 'OPEN').length;
    const closedRecords = totalRecords - openRecords;

    const allEvaluations = records.flatMap(r => r.evaluations || []);
    const totalEvaluations = allEvaluations.length;

    const complianceStatusCounts = allEvaluations.reduce((acc, evaluation) => {
        acc[evaluation.complianceStatus] = (acc[evaluation.complianceStatus] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const complianceStatusData = COMPLIANCE_STATUS_ORDER.map(({ status, color }) => ({
        name: status,
        value: complianceStatusCounts[status] || 0,
        fill: color,
    })).filter(d => d.value > 0);

    const followUpStatusData = [
        { name: 'OPEN', value: openRecords, fill: 'hsl(var(--chart-4))' },
        { name: 'CLOSED', value: closedRecords, fill: 'hsl(var(--chart-2))' },
    ].filter(d => d.value > 0);
    
    return {
      totalRecords,
      openRecords,
      closedRecords,
      complianceStatusData,
      followUpStatusData,
      totalEvaluations
    };
  }, [records]);

  if (!analyticsData) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No data to analyze.</p>
        <p className="text-sm">Filter results to see analytics.</p>
      </div>
    );
  }
  
  const complianceChartConfig = analyticsData.complianceStatusData.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill };
    return acc;
  }, {} as any);
  
  const followUpChartConfig = analyticsData.followUpStatusData.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill };
    return acc;
  }, {} as any);

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><GitCompareArrows className="h-5 w-5 text-muted-foreground"/> Total Records</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold"><AnimatedCounter endValue={analyticsData.totalRecords} /></p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-destructive"/> Open Records</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold"><AnimatedCounter endValue={analyticsData.openRecords} /></p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500"/> Closed Records</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold"><AnimatedCounter endValue={analyticsData.closedRecords} /></p>
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Follow Up Status Distribution</CardTitle>
                <CardDescription>
                    Breakdown of all records by their final follow up status (OPEN/CLOSED).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={followUpChartConfig} className="mx-auto aspect-square h-[250px]">
                    <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie data={analyticsData.followUpStatusData} dataKey="value" nameKey="name" innerRadius="60%">
                            {analyticsData.followUpStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                         <ChartLegend
                            content={<ChartLegendContent nameKey="name" />}
                            className="-translate-y-[2rem] flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Compliance/Differences Status Distribution</CardTitle>
                <CardDescription>
                    Breakdown of compliance status across all evaluation items ({analyticsData.totalEvaluations} total items).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={complianceChartConfig} className="h-[250px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={analyticsData.complianceStatusData} margin={{ top: 20 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tick={false} />
                            <YAxis allowDecimals={false} />
                            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="value" radius={4}>
                                {analyticsData.complianceStatusData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.fill} />
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

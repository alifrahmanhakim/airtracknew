
'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GapAnalysisRecord } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { GitCompareArrows, Info, FolderOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

type GapAnalysisAnalyticsDashboardProps = {
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

export function GapAnalysisAnalyticsDashboard({ records }: GapAnalysisAnalyticsDashboardProps) {
    const [annexFilter, setAnnexFilter] = useState('all');

    const annexOptions = useMemo(() => {
        const annexes = new Set(records.map(r => r.annex));
        return ['all', ...Array.from(annexes)];
    }, [records]);

    const filteredRecords = useMemo(() => {
        if (annexFilter === 'all') {
            return records;
        }
        return records.filter(record => record.annex === annexFilter);
    }, [records, annexFilter]);

  const analyticsData = useMemo(() => {
    if (filteredRecords.length === 0) {
      return null;
    }

    const countBy = (key: keyof GapAnalysisRecord) => filteredRecords.reduce((acc, record) => {
        const value = record[key] as string | undefined;
        if (value) {
            acc[value] = (acc[value] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const allEvaluations = filteredRecords.flatMap(r => r.evaluations || []);
    const complianceStatusCounts = allEvaluations.reduce((acc, evaluation) => {
        acc[evaluation.complianceStatus] = (acc[evaluation.complianceStatus] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const complianceStatusData = Object.entries(complianceStatusCounts).map(([name, value]) => ({ name, value }));
    
    const statusItemCounts = filteredRecords.reduce((acc, record) => {
        acc[record.statusItem] = (acc[record.statusItem] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const statusItemData = Object.entries(statusItemCounts).map(([name, value]) => ({ name, value }));
    
    const annexData = Object.entries(countBy('annex')).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    const casrData = Object.entries(countBy('casrAffected')).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    const totalRecords = filteredRecords.length;
    const openItems = statusItemCounts['OPEN'] || 0;
    const openPercentage = totalRecords > 0 ? (openItems / totalRecords) * 100 : 0;

    return {
      totalRecords,
      openItems,
      openPercentage,
      complianceStatusData,
      statusItemData,
      annexData,
      casrData
    };
  }, [filteredRecords]);

  if (records.length === 0) {
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
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>GAP Analysis Analytics Dashboard</CardTitle>
                    <CardDescription>
                        Visualizations of the GAP Analysis data.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Label htmlFor="annex-filter" className="text-sm font-medium">Filter by Annex</Label>
                    <Select value={annexFilter} onValueChange={setAnnexFilter}>
                        <SelectTrigger id="annex-filter" className="w-[280px]">
                            <SelectValue placeholder="Filter by Annex..." />
                        </SelectTrigger>
                        <SelectContent>
                            {annexOptions.map(annex => (
                                <SelectItem key={annex} value={annex}>
                                    {annex === 'all' ? 'All Annexes' : annex}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
        </Card>
        {!analyticsData ? (
             <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
                <Info className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">No data for "{annexFilter}"</p>
                <p className="text-sm">Select a different filter to see analytics.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                        <GitCompareArrows className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.totalRecords}</div>
                        <p className="text-xs text-muted-foreground">Total GAP analysis records</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Items</CardTitle>
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.openItems}</div>
                        <p className="text-xs text-muted-foreground">{analyticsData.openPercentage.toFixed(1)}% of items require follow up</p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Follow Up Status</CardTitle>
                        <CardDescription>Distribution of OPEN vs CLOSED items.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center h-[120px]">
                        <ChartContainer config={chartConfig(analyticsData.statusItemData)} className="mx-auto aspect-square h-full">
                            <PieChart>
                                <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent hideLabel />} />
                                <Pie data={analyticsData.statusItemData} dataKey="value" nameKey="name" innerRadius={35} outerRadius={55} strokeWidth={5}>
                                    {analyticsData.statusItemData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={chartConfig(analyticsData.statusItemData)[entry.name].color} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center" />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Top CASR Affected</CardTitle>
                        <CardDescription>Distribution of records per CASR affected.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer config={chartConfig(analyticsData.casrData)} className="h-[300px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={analyticsData.casrData.slice(0, 10)} layout="vertical" margin={{ left: 50, right: 30 }}>
                                    <YAxis dataKey="name" type="category" width={100} interval={0} tick={{ fontSize: 12 }} />
                                    <XAxis type="number" allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="value" name="Record Count" radius={[0, 4, 4, 0]}>
                                        {analyticsData.casrData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>DGCA Compliance/Differences Status</CardTitle>
                        <CardDescription>Breakdown of all compliance statuses from evaluations.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer config={chartConfig(analyticsData.complianceStatusData)} className="h-[300px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={analyticsData.complianceStatusData} layout="horizontal" margin={{ right: 30, top: 20, bottom: 80 }}>
                                    <XAxis dataKey="name" type="category" angle={-45} textAnchor="end" height={100} interval={0} tick={{ fontSize: 10 }} />
                                    <YAxis type="number" allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="value" name="Record Count" radius={[4, 4, 0, 0]}>
                                        {analyticsData.complianceStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
}

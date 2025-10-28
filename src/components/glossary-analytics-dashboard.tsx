
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GlossaryRecord } from '@/lib/types';
import { Info, PieChartIcon } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from './ui/chart';
import { format, parseISO } from 'date-fns';

type GlossaryAnalyticsDashboardProps = {
  records: GlossaryRecord[];
};

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(34.9, 91.6%, 52.9%)' // Orange for Draft
];

export function GlossaryAnalyticsDashboard({ records }: GlossaryAnalyticsDashboardProps) {
  const analyticsData = useMemo(() => {
    if (records.length === 0) {
      return null;
    }

    const statusCounts = records.reduce((acc, record) => {
        const status = record.status || 'Usulan';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const totalStatus = Object.values(statusCounts).reduce((acc, v) => acc + v, 0);

    const statusData = Object.entries(statusCounts)
        .map(([name, value]) => ({
             name: `${name} (${value} - ${totalStatus > 0 ? ((value / totalStatus) * 100).toFixed(1) : 0}%)`,
             value,
             originalName: name
        }))
        .sort((a,b) => b.value - a.value);

    const monthlyData = records.reduce((acc, record) => {
        const month = format(parseISO(record.createdAt as string), 'yyyy-MM');
        const status = record.status || 'Usulan';
        if (!acc[month]) {
            acc[month] = { month, Draft: 0, Final: 0, Usulan: 0 };
        }
        if (status in acc[month]) {
            acc[month][status as 'Draft' | 'Final' | 'Usulan']++;
        }
        return acc;
    }, {} as Record<string, { month: string; Draft: number; Final: number; Usulan: number }>);
    
    const monthlyCreationData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));


    return {
      totalRecords: records.length,
      statusCounts,
      statusData,
      monthlyCreationData
    };
  }, [records]);

  if (!analyticsData) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No data to analyze.</p>
        <p className="text-sm">Add records to see analytics.</p>
      </div>
    );
  }

  const chartConfig = (data: {name: string, value: number, originalName?: string}[]) => ({
      value: { label: 'Count' },
      ...data.reduce((acc, item, index) => {
          const key = item.originalName || item.name;
          let color = CHART_COLORS[index % CHART_COLORS.length];
          if(key === 'Draft') color = 'hsl(34.9, 91.6%, 52.9%)'; // Orange
          if(key === 'Final') color = 'hsl(var(--chart-1))'; // Green
          acc[key] = { label: item.name, color: color};
          return acc;
      }, {} as any)
  });
  
  const monthlyChartConfig = {
      Draft: { label: `Draft (${analyticsData.statusCounts['Draft'] || 0})`, color: 'hsl(34.9, 91.6%, 52.9%)' },
      Final: { label: `Final (${analyticsData.statusCounts['Final'] || 0})`, color: 'hsl(var(--chart-1))' },
      Usulan: { label: `Usulan (${analyticsData.statusCounts['Usulan'] || 0})`, color: 'hsl(var(--chart-3))' },
  }

  return (
    <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PieChartIcon /> Status Distribution</CardTitle>
                    <CardDescription>Breakdown of all records by their status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig(analyticsData.statusData)} className="mx-auto aspect-square h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <ChartTooltip wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent hideLabel />} />
                                <Pie data={analyticsData.statusData} dataKey="value" nameKey="originalName" innerRadius={60} strokeWidth={5}>
                                    {analyticsData.statusData.map((entry, index) => (
                                        <Cell key={`cell-${entry.originalName}`} fill={chartConfig(analyticsData.statusData)[entry.originalName].color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Status Breakdown</CardTitle>
                    <CardDescription>Detailed count and percentage for each status.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {analyticsData.statusData.map(item => (
                        <div key={item.originalName} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: chartConfig(analyticsData.statusData)[item.originalName].color }}
                                />
                                <span className="text-sm font-medium">{item.originalName}</span>
                            </div>
                            <span className="text-sm font-semibold">{item.value} ({((item.value / analyticsData.totalRecords) * 100).toFixed(1)}%)</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Monthly Record Creation by Status</CardTitle>
                <CardDescription>Number of records created each month, broken down by status.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={monthlyChartConfig} className="h-[350px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={analyticsData.monthlyCreationData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => format(parseISO(value), 'MMM yyyy')}
                            />
                            <YAxis allowDecimals={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Bar dataKey="Draft" stackId="a" fill="var(--color-Draft)" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="Final" stackId="a" fill="var(--color-Final)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Usulan" stackId="a" fill="var(--color-Usulan)" radius={[0, 0, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
